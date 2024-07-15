---
title: "【Bluesky】PDSを建てた"
description: ''
date: ''
emoji: "🦋"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
    - ATProtocol
    - Bluesky
published: false
---

こんにちは、あるいはこんばんは。ここあです。  
今回、ATProtocolのPDSを建てたのですが、それなりに苦戦したので記録しておきます。  

:::message alert
この記事では、既存環境への導入を目指します。また、Cloudflare Zero Trustを介して通信をします。  
ドキュメントままでまっさらな環境に立ち上げる分には詰まる箇所は殆どないかと思います。
:::



## 構成
筆者の環境は以下のとおりです。

- ハードウェア
  - Pentium Gold G7400
    - ベンチマークの仕方にもよるが7世代Core i5や9世代 Core i5並の性能は出せる
  - RAM: 16GB
- OS
  - Ubuntu server 22.04
- その他
  - Minio
  - Docker 20.10.21
  - Docker compose 2.26.1
  - Cloudflare Zero trust

システム構築当初、 `docker compose`がV1だったためインストーラが途中でコケてしまいました。この記事を読んでいる皆さんは忘れずに `compose V2`へと事前にアップデートしておきましょう。

筆者の手順をなぞった場合、最終的なディレクトリ構成は以下のようになります。

```
.
├── conf.d
│   ├── compose.yaml
│   ├── nginx
│   │   ├── conf.d
│   │   │   ├── 00_resolve_websocket.conf
│   │   │   ├── 10_xxxxxxxxxxxxxxxx.conf
│   │   │   └── 20_xxxxxxxxxxxxxxxx-did.conf
│   │   └── www
│   └── pds.env
└── data
    ├── account.sqlite
    ├── actors
    │   └── 24
    │       └── did:plc:35xxxxxxxxxxxxxxx
    │           ├── key
    │           └── store.sqlite
    ├── did_cache.sqlite
    └── sequencer.sqlite
```



## まずは普通にインストールする

コマンド一発、いや、二発でインストールできます。  

```
curl https://raw.githubusercontent.com/bluesky-social/pds/main/installer.sh >installer.sh
sudo bash installer.sh
```

なお、このスクリプトを見てみると、どうも

```
sudo bash installer.sh <PDS_DATADIR> <PDS_HOST_NAME> <PDS_ADMIN_EMAIL>
```
の形式で実行できるようですね。  
ただ、`<PDS_DATADIR>`はいまのところ **/pds** 以外は指定できないようです。  
その他の2項目に関してもインストールの段階で質問されるので、ここで指定しなくても問題ありません


## Cloudflare Zero Trustとつなげていく
### CaddyをNginxに置き換える
Cloudflare系列を使っている場合、おそらくは証明書もCloudflare管理のものを使用していると思います。そうすると、Caddyの旨味である証明書の自動発行などはあまり嬉しさもないですね。  
ということもあり、Nginxに置き換えていきます。  

::: message 
ATProtocolにおいて（？）各ユーザのdidを解決するには、 `<handle>/.well-known/atproto-did`にアクセスしてdidを返す必要があります。TXTレコードでも解決はできるのですが、ユーザごとにTXTレコードを都度用意するのは現実的ではありませんね。  
:::

::: message
ただ、そのままPDSに直接`<handle>`を聞くとdidを返してくれていたような気がしなくもありません。（この表現は曖昧です。）  
その場合でも、アクセス制限にもNginxを利用することができるので、導入しておいて損はないかと思います。
:::

#### Compose.yamlの修正


``` diff yaml:compose.yaml
version: '3.9'
services:
-  caddy:
-    container_name: caddy
-    image: caddy:2
-    network_mode: host
-    depends_on:
-      - pds
-    restart: unless-stopped
-    volumes:
-      - type: bind
-        source: /pds/caddy/data
-        target: /data
-      - type: bind
-        source: /pds/caddy/etc/caddy
-        target: /etc/caddy
+  nginx:
+    ports:
+      - 15641:80
+    image: nginx:alpine
+    restart: unless-stopped
+    volumes:
+      - ./nginx/conf.d:/etc/nginx/conf.d
+      - ./nginx/www:/var/www
+    depends_on:
+      - pds
+-    network_mode: host
+    networks:
+      - frontend
  pds:
    image: ghcr.io/bluesky-social/pds:0.4
-    network_mode: host
+    networks:
+      - frontend
+      - backend
+    restart: unless-stopped
    volumes:
      - type: bind
        source: /pds
        target: /pds
    env_file:
      - ./pds/pds.env
+# docker network
+networks:
+  frontend:
+    driver: bridge
+    ipam:
+      driver: default
+      config:
+        - subnet: 172.50.10.0/24
+  backend:
+    driver: bridge
+    ipam:
+      driver: default
+      config:
+        - subnet: 172.50.20.0/24
```




### Nginxを使わない場合
この場合は、PDSに直接httpを喋らせる必要があるので、そのように設定を変更します。  

``` diff yaml:compose.yaml
version: '3.9'
services:
-  caddy:
-    container_name: caddy
-    image: caddy:2
-    network_mode: host
-    depends_on:
-      - pds
-    restart: unless-stopped
-    volumes:
-      - type: bind
-        source: /pds/caddy/data
-        target: /data
-      - type: bind
-        source: /pds/caddy/etc/caddy
-        target: /etc/caddy
  pds:
    image: ghcr.io/bluesky-social/pds:0.4
    network_mode: host
    ports:
+      - 15641:3000
    volumes:
      - type: bind
        source: /pds
        target: /pds
    env_file:
      - ./pds/pds.env
```


### Cloudflare ZeroTrustでマッピングする

## 動作確認する


## システムからメールが飛んでくるようにする
筆者はsmtpサーバを持っているので、これを使ってメールが飛んでくるようにしました。  
そうでない場合でも、例えばGmailのsmtpサービスを使っても良いでしょう。


## さらにややこしく


### PDSの置き場所を変更する
わたしが使用しているサーバはZFSのストレージを持っているので、耐障害性などを考慮し、そちらに移動することにしました。

そこで、3つのファイルを変更します。


言わずとしれたsystemdのファイルですね。  
これは変更しなくても良かったのですが、設定ファイルも移動したいと思い、それに伴い編集しています。  

`pds.env`や`compose.yaml`を移動しないのであれば編集不要です。

``` /etc/systemd/system/pds.service
WorkingDirectory=/tank/data/app/pds
ExecStart=/usr/bin/docker compose --file /tank/data/app/pds/compose.yaml up --detach
ExecStop=/usr/bin/docker compose --file /tank/data/app/pds/compose.yaml down
```


docker composeの設定ファイルですね。  
ストレージのバインド設定と、環境設定ファイル(`pds.env`)の場所を変えたので、それに伴い修正しています。  
ただし、 **イメージ内でのpdsフォルダの場所はいじっていません**


``` compose.yaml
    volumes:
      - type: bind
        source: /tank/data/app/pds
        target: /pds
    env_file:
      - /tank/data/app/pds/pds.env
```

最後に、pdsの環境設定ファイルですが、こちらは **いじっていません**  
下記の値は、イメージ内のパスであり、今回はそれをいじっていないので変更不要です。  
筆者はこれをリアルなパスであると勘違いし、小一時間溶かしました。

``` pds.env
PDS_DATA_DIRECTORY=/pds
PDS_BLOBSTORE_DISK_LOCATION=/pds/blocks
```

### S3（互換ストレージ）をBlob置き場にする
minioというものをご存知でしょうか？？  
簡単に言ってしまうと、OSSのオブジェクトストレージです。