---
title: "ZFSの定期スナップショットをS3に自動バックアップするようにした"
emoji: "🗃️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
    - ZFS
    - AWS
    - S3
published: true
---
こんにちは
最近、ようやく重い腰を上げてLAN内に存在しているNASの定期バックアップをS3に投げ始めたので、その手順をまとめていこうと思います。  

なお前提として、NASはZFSで構築されているものとします。

:::message
「スナップショット」と「バックアップ」で表記が揺れている箇所があるかもしれません。  
ZFSで取得した時点のものを「スナップショット」、S3に送信する/されたものを「バックアップ」と言っているつもりです。
:::


## 環境
- Ubuntu Server 22.04.4
- ZFS 2.1.5


## バックアップ要件

バックアップ頻度は、以下とします。

|バックアップ頻度|移行後ストレージクラス(移行日数)|削除タイミング(バックアップから起算)|
|:---:|:---:|:---:|
|月次|Glacier Deep Archive(90日後)|540日後|
|週次|Glacier Deep Archive(90日後)|270日後|
|日次|-|90日後|

90日以降は日単位でのバックアップは失われてしまいますが、今回はそれを許容することとしました。  
また、日次バックアップは、最新の週次バックアップからの増分バックアップとしています。これにより、ストレージコストや転送時間を抑えることができます。  


つまり、日単位での復元を行いたい場合には、

1. 復元対象の週のバックアップを適用し、
1. 対象日の増分バックアップを適用する

という操作で復元することが可能です。

また、各バックアップはLZ4圧縮することにします。圧縮率はそこまで高くありませんが、圧縮及び展開時のパフォーマンスがとても高く、ZFSそのものの圧縮にも使用されていて、親和性は高いと思います。

:::message
Glacier Deep Archiveは容量単価が圧倒的に低いですが、その代わりとして180日以内に削除行為を行うと180日に満たない期間分のコストが発生してしまいます。特に自動削除などを適用する場合には頭に入れておきましょう。
:::

## 事前準備
### AWSのアクセスキーの取得
S3へアクセスするためのユーザを作成し、そのアクセスキーを取得しておいてください。


### ツールのインストール
今回、S3へのバックアップはaws cliを直接使うのではなく、 `rclone` というツールを使用します。  
また、スナップショットの自動化は、 `zfs-auto-snapshot`というツールを使用します。


```
sudo apt install rclone zfs-auto-snapshot
```

### ツールのセットアップ
#### rcloneのセットアップ
まずは、 `rclone` のセットアップをします。対話的に設定が可能なツールですが、それをすべて掲載すると非常に長くなってしまうので、必要な箇所のみを抜粋して掲載します。  

```
rclone config
```
とすることで、設定が始まります。
この設定で触れていない部分はデフォルトの設定で問題ありません。


:::details rcloneの設定

```
....
n) New remote
q) Quit config
e/n/d/r/c/s/q> n

Enter name for new remote.
name> AWS_S3  


Option Storage.

Type of storage to configure.
Choose a number from below, or type in your own value.
 1 / 1Fichier
   \ (fichier)
 2 / Akamai NetStorage
   \ (netstorage)
 3 / Alias for an existing remote
   \ (alias)
 4 / Amazon Drive
   \ (amazon cloud drive)
 5 / Amazon S3 Compliant Storage Providers including AWS, Alibaba, ArvanCloud, Ceph, China Mobile, Cloudflare, GCS, DigitalOcean, Dreamhost, Huawei OBS, IBM COS, IDrive e2, IONOS Cloud, Leviia, Liara, Lyve Cloud, Minio, Netease, Petabox, RackCorp, Scaleway, SeaweedFS, StackPath, Storj, Synology, Tencent COS, Qiniu and Wasabi
   \ (s3)
 6 / Backblaze B2
   \ (b2)
....
....
Storage> 5

Option provider.
Choose your S3 provider.
Choose a number from below, or type in your own value.
Press Enter to leave empty.
 1 / Amazon Web Services (AWS) S3
   \ (AWS)
 2 / Alibaba Cloud Object Storage System (OSS) formerly Aliyun
   \ (Alibaba)
 3 / Arvan Cloud Object Storage (AOS)
   \ (ArvanCloud)
 4 / Ceph Object Storage
   \ (Ceph)
 5 / China Mobile Ecloud Elastic Object Storage (EOS)
   \ (ChinaMobile)
 6 / Cloudflare R2 Storage
   \ (Cloudflare)
....
....
provider> 1


Option access_key_id.
AWS Access Key ID.
Leave blank for anonymous access or runtime credentials.
Enter a value. Press Enter to leave empty.
access_key_id> xxxxxxxxxxxxxx

Option secret_access_key.
AWS Secret Access Key (password).
Leave blank for anonymous access or runtime credentials.
Enter a value. Press Enter to leave empty.
secret_access_key> xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx


Configuration complete.
Options:
- type: s3
- provider: AWS
- access_key_id: xxxxxxxxxxxxxxxx
- secret_access_key: xxxxxxxxxxxxxxxxxxxxxxxxxxxx
Keep this "AWS_S3" remote?
y) Yes this is OK (default)
e) Edit this remote
d) Delete this remote
y/e/d> y
```
:::

以上の設定で、 `AWS_S3` という識別子を使って、 `rclone`でS3を触れるようになりました。


#### zfs-auto-snapshotのセットアップ
おそらく、本ツールをインストールすることで、cronの各ディレクトリに `zfs-auto-snapshot` というスクリプトが配置されていると思います。

```
etc
├── cron.d
│   └── zfs-auto-snapshot
├── cron.daily
│   └── zfs-auto-snapshot
├── cron.hourly
│   └── zfs-auto-snapshot
├── cron.monthly
│   └── zfs-auto-snapshot
├── cron.weekly
    └── zfs-auto-snapshot
```

このうち、今回対象とするのは `daily`, `weekly`, `monthly` です。  
中身はおおよそ以下の内容になっていると思います。(筆者はすでに編集してしまっているので、オプションに差異があるかもしれません。)

```sh: /etc/cron.daily/zfs-auto-snapshot
#!/bin/sh

# Only call zfs-auto-snapshot if it's available
which zfs-auto-snapshot > /dev/null || exit 0

exec zfs-auto-snapshot --quiet --syslog --label=daily --verbose --keep=31
```

ひとまずこれを、プールを指定してスナップショット取得が走るように修正します。  
なお、ここではプール名は `tank` とし、配下のデータセットを再帰的にスナップショットを取得するようにします。

```
exec zfs-auto-snapshot --quiet --syslog --label=daily --verbose --recursive --keep=31 tank
```

これらの修正を、 `weekly`, `monthly` に対しても行うようにします。  

こうすることで、スナップショットが定期的に取得されるようになります。  



:::details スナップショットの様子

```sh:
zfs list -t snapshot
NAME                                                 USED  AVAIL     REFER  MOUNTPOINT
tank@zfs-auto-snap_daily-2024-04-17-12h21              0B      -      128K  -
tank@zfs-auto-snap_monthly-2024-05-01-0652             0B      -      128K  -
tank@zfs-auto-snap_daily-2024-05-27-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-05-28-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-05-29-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-05-30-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-05-31-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-01-0625               0B      -      128K  -
tank@zfs-auto-snap_monthly-2024-06-01-0652             0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-02-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-03-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-04-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-05-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-06-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-07-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-08-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-09-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-10-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-11-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-12-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-13-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-14-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-15-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-16-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-17-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-18-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-19-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-20-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-21-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-22-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-23-0625               0B      -      128K  -
tank@zfs-auto-snap_weekly-2024-06-23-0647              0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-24-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-25-0625               0B      -      128K  -
tank@zfs-auto-snap_daily-2024-06-26-0625               0B      -      128K  -
tank/data@zfs-auto-snap_daily-2024-04-17-12h21      1.14M      -     8.04G  -
tank/data@zfs-auto-snap_monthly-2024-05-01-0652     1.20M      -     8.04G  -
tank/data@zfs-auto-snap_daily-2024-05-27-0625        581K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-05-28-0625        549K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-05-29-0625        485K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-05-30-0625        735K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-05-31-0625        575K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-01-0625        426K      -     8.05G  -
tank/data@zfs-auto-snap_monthly-2024-06-01-0652      426K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-02-0625        543K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-03-0625        549K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-04-0625        512K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-05-0625        501K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-06-0625        448K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-07-0625        426K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-08-0625        437K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-09-0625        437K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-10-0625        437K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-11-0625        469K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-12-0625        437K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-13-0625        458K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-14-0625        469K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-15-0625        480K      -     8.05G  -
tank/data@zfs-auto-snap_daily-2024-06-16-0625       1.14M      -     8.04G  -
tank/data@zfs-auto-snap_daily-2024-06-17-0625       2.38M      -     8.04G  -
tank/data@zfs-auto-snap_daily-2024-06-18-0625       1.38M      -     8.04G  -
tank/data@zfs-auto-snap_daily-2024-06-19-0625       1.54M      -     8.04G  -
tank/data@zfs-auto-snap_daily-2024-06-20-0625       1.06M      -     8.04G  -
tank/data@zfs-auto-snap_daily-2024-06-21-0625        884M      -     10.0G  -
tank/data@zfs-auto-snap_daily-2024-06-22-0625       1.86M      -     9.16G  -
tank/data@zfs-auto-snap_daily-2024-06-23-0625        416K      -     9.16G  -
tank/data@zfs-auto-snap_weekly-2024-06-23-0647       416K      -     9.16G  -
tank/data@zfs-auto-snap_daily-2024-06-24-0625       1.80M      -     9.16G  -
tank/data@zfs-auto-snap_daily-2024-06-25-0625        426K      -     9.16G  -
tank/data@zfs-auto-snap_daily-2024-06-26-0625        437K      -     9.16G  -
```
:::


ちなみに筆者は、より細かい `frequent`(15分単位)、 `hourly`(1時間単位) のスナップショットも保持しています。

さて、ここまでで定期的なスナップショットは取れるようになり、事前準備が完了しました。  
続いて、S3に送信するためのスクリプトを書いていきます。  


## S3送信スクリプトの実装
今回は、スクリプトを共通化せずにそれぞれ計3種類を用意します。

### 月次バックアップ送信スクリプト

```sh: /usr/local/bin/zfs_monthly_snapshot_to_s3.sh
#!/bin/bash

# ZFS pool
POOL="tank"

RCLONE_CONFIG="/path/to/.config/rclone/rclone.conf"

# データセットの一覧を取得
DATASETS=$(sudo zfs list -H -o name -t filesystem,volume -r ${POOL})

for DATASET in $DATASETS; do
  SNAPSHOT=$(sudo zfs list -H -o name -t snapshot -r ${DATASET} | grep "${DATASET}@zfs-auto-snap_monthly.*" | tail -n 1)
  SNAPSHOT_FOR_PATH=$(echo "$SNAPSHOT" | sed 's|/|_|g')
  

  if [ -n "$SNAPSHOT" ]; then
    SNAPSHOT_PATH="periodic-snapshot/monthly/${SNAPSHOT_FOR_PATH}.lz4"
    echo "uploading $SNAPSHOT to s3....($SNAPSHOT_PATH)"
    
    # オプション盛り盛りで送信する
    # LZ4圧縮
    # S3標準暗号化
    # 4分割送信
    # Standard IAクラス明示
    sudo zfs send "$SNAPSHOT" | lz4 -c | rclone --config "$RCLONE_CONFIG" rcat --s3-server-side-encryption "AES256" --multi-thread-streams=4 --s3-storage-class STANDARD_IA "AWS_S3:${SNAPSHOT_PATH}"
  fi
done
```

下記の部分は、 `tank/data` のように、 `<pool>/<dataset>` がS3のマネジメントコンソールにおいて階層を持たないようにするための対応です。

```
SNAPSHOT_FOR_PATH=$(echo "$SNAPSHOT" | sed 's|/|_|g')
```



### 週次バックアップ送信スクリプト

こちらは週次のバックアップ用スクリプトですが、月次とほとんど変わらないので説明は省きます。

```sh: /usr/local/bin/zfs_weekly_snapshot_to_s3.sh
#!/bin/bash

# ZFS pool
POOL="tank"

RCLONE_CONFIG="/path/to/.config/rclone/rclone.conf"

# データセットの一覧を取得
DATASETS=$(sudo zfs list -H -o name -t filesystem,volume -r ${POOL})

for DATASET in $DATASETS; do
  SNAPSHOT=$(sudo zfs list -H -o name -t snapshot -r ${DATASET} | grep "${DATASET}@zfs-auto-snap_weekly.*" | tail -n 1)

  SNAPSHOT_FOR_PATH=$(echo "$SNAPSHOT" | sed 's|/|_|g')

  if [ -n "$SNAPSHOT" ]; then
    SNAPSHOT_PATH="periodic-snapshot/weekly/${SNAPSHOT_FOR_PATH}.lz4"
    echo "uploading $SNAPSHOT to S3....($SNAPSHOT_PATH)"
    
    # オプション盛り盛りで送信する
    # LZ4圧縮
    # S3標準暗号化
    # 4分割送信
    # Standard IAクラス明示
    sudo zfs send "$SNAPSHOT" | lz4 -c | rclone --config "$RCLONE_CONFIG" rcat --s3-server-side-encryption "AES256" --multi-thread-streams=4 --s3-storage-class STANDARD_IA "AWS_S3:${SNAPSHOT_PATH}"
  fi
done
```


### 日次バックアップ送信スクリプト

こちらは日次バックアップのスクリプトです。これまでのスクリプトと比較すると、少し複雑なことをしています。  


```sh: /usr/local/bin/zfs_daily_snapshot_to_s3.sh
#!/bin/bash

# ZFS pool
POOL="tank"

RCLONE_CONFIG="/path/to/.config/rclone/rclone.conf"

# データセットの一覧を取得
DATASETS=$(sudo zfs list -H -o name -t filesystem,volume -r ${POOL})

for DATASET in $DATASETS; do
  DAILY_SNAPSHOT=$(sudo zfs list -H -o name -t snapshot -r ${DATASET} | grep "${DATASET}@zfs-auto-snap_daily.*" | tail -n 1)
  WEEKLY_SNAPSHOT=$(sudo zfs list -H -o name -t snapshot -r ${DATASET} | grep "${DATASET}@zfs-auto-snap_weekly.*" | tail -n 1)

  # パスの決定
  DAILY_SNAPSHOT_FOR_PATH=$(echo "$DAILY_SNAPSHOT" | sed 's|/|_|g')
  WEEKLY_SNAPSHOT_FOR_PATH=$(echo "$WEEKLY_SNAPSHOT" | sed 's|/|_|g')


  if [ -n "$DAILY_SNAPSHOT" ] && [ -n "$WEEKLY_SNAPSHOT" ]; then
    SNAPSHOT_PATH="periodic-snapshot/daily/${WEEKLY_SNAPSHOT_FOR_PATH}/${DAILY_SNAPSHOT_FOR_PATH}.lz4"
    echo "uploading incremental snapshot from $WEEKLY_SNAPSHOT  $DAILY_SNAPSHOT to S3...($SNAPSHOT_PATH)"
    
    # オプション盛り盛りで送信する
    # 最新の週次からの増分
    # LZ4圧縮
    # S3標準暗号化
    # 4分割送信
    # Standard IAクラス明示
    zfs send -i "$WEEKLY_SNAPSHOT" "$DAILY_SNAPSHOT" | lz4 -c | rclone --config "$RCLONE_CONFIG" rcat --s3-server-side-encryption "AES256" --multi-thread-streams=4 --s3-storage-class STANDARD_IA "AWS_S3:${SNAPSHOT_PATH}"
  fi
done
```

以下の部分では、他のスクリプトと同様に保存パス（キー）を決めているのですが、日次バックアップを増分としているため、少し工夫をしています。
この処理を行うと、 `daily/<最新の週次スナップショット名>/<日次スナップショット名>.lz4` というパスが生成されるので、週次バックアップと合わせて見つけやすくなります。

```
SNAPSHOT_PATH="periodic-snapshot/daily/${WEEKLY_SNAPSHOT_FOR_PATH}/${DAILY_SNAPSHOT_FOR_PATH}.lz4"
```

### バックアップ送信スクリプトを定期的に呼び出す
`zfs-auto-snapshot` により作成されたスクリプトを以下のように修正します。

```sh: /etc/cron.daily/zfs-auto-snapshot
#!/bin/sh

# Only call zfs-auto-snapshot if it's available
which zfs-auto-snapshot > /dev/null || exit 0

zfs-auto-snapshot --quiet --syslog --label=daily --verbose --recursive --keep=31 tank
/bin/bash /usr/local/bin/zfs_daily_snapshot_to_s3.sh
```

:::note warn
元のスクリプトと比較して `exec` がなくなっていることに注意してください。  
`exec` はシェルを上書きするため、以降の処理が実行されなくなり、結果としてスナップショットが送信されなくなります。  
筆者はこの挙動を忘れていてどハマリしました。
:::


## ライフサイクルポリシーの適用
最後に、ライフサイクルポリシーを適用します。
下記のようなファイルを作成してください。なお、ここで作成・適用するポリシーは冒頭で触れた条件で作成しています。

```json: lifecycle-policy.json
{
  "Rules": [
    {
      "ID": "DeleteDailySnapshots",
      "Filter": {
        "Prefix": "daily/"
      },
      "Status": "Enabled",
      "Expiration": {
        "Days": 90
      }
    },
    {
      "ID": "MoveWeeklyToGlacierThenDelete",
      "Filter": {
        "Prefix": "weekly/"
      },
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 270
      }
    },
    {
      "ID": "MoveMonthlyToGlacierThenDelete",
      "Filter": {
        "Prefix": "monthly/"
      },
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 540
      }
    }
  ]
}
```

作成したら、適用します。

```shell
aws s3api put-bucket-lifecycle-configuration --bucket periodic-snapshot  --lifecycle-configuration file://lifecycle-policy.json
```

以上で、ローカルにあるZFSなシステムの定期スナップショットを、S3に送信してバックアップができるようになりました。


## まとめ
- ZFSストレージはスナップショットがほぼ瞬時に取ることができますが、それだけで満足せずにしっかりと信頼できる外部、例えばS3へと送信しましょう。
- Standard IAやGlacier Deep Archiveなど、アクセス頻度に応じて適切なストレージクラスを選択してコストを抑えましょう。