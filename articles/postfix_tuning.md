---
title: "メールサーバが不正利用されたぽいので改めて対策をした"
description: ''
date: '2024-10-07T01:59:00.000+09:00'
emoji: "💭"
type: "tech" # tech: 技術記事 / idea: アイデア
topics:
  - Postfix
published: true
---


## TL; DR;  
- AWSのコストアラートは適切に設定し、おかしいと思ったらちゃんと確認しよう
- Postfixには適切な設定を行おう
- パスワードや鍵は定期的に交換しよう
- 構成変更後は慎重に検証しよう
- 自前での構築をやめて、サービスを使うことも検討しよう。


## 背景
5年ほど運用していたメールサーバが、2024年10月4日の午前6時ころに爆発的に利用されている痕跡を、当日の昼頃に発見しました。  
営業日だったので、ひとまず一次対応としてPostfixを止めて、終業後にキレながら対応しました。  

::: message alert
まずは、 **わたしからスパムメールを受け取った方、ご迷惑をおかけして大変申し訳ありませんでした。**

:::

さて、なぜいまごろ被害を受けることになったのかですが、おそらく8月末に自宅のネットワーク構成を変更したことにあると睨んでいます。  
それまでは、自宅のネットワーク構成は以下のようになっていました。  

- PPPoE接続の、IPv4回線
- IPoE接続の、IPv6回線（IPv4 over IPv6は使用可能）

それらをコスト削減のために、一本化することにし、後者の回線を残しました。  
ここで、任意のポートを開放することができないためサーバ公開ができない、という問題がありました。そもそもそれが、2回線残っていた理由です。  


ここでひらめきました。**EC2を踏み台にしてCloudflare Tunnelでローカルマシンに接続できるようにし、SSHでポートフォワードすればメールサーバの公開は続けられるのではないか** と。  
こうして踏み台ができ、しっかりと機能していることが確認できたため、PPPoE回線の契約は解除できました。契約更新月ではなかったので違約金は発生しましたが、更新月まで待つのと比較しても違約金のほうが安く、目的は達成できました。  

このときのネットワークをざっくりと図に表したものが以下です。

![](/images/postfix_tuning/0001.png)


めでたし、めでたし。
ではなかったことに、1ヶ月経過してから気が付きました。  

ここで、**ポートフォワードしているということは、メールサーバから見るとlocalhostからの接続になる** というヒントを出しておきます。勘の良い読者の皆様ならこれだけで真実にたどり着けることでしょう。



これを受けて、Postfixの設定を再度見直しました。　　

::: message 
この記事は、わたしが「この設定をしました」というだけのものであり、推奨設定を説明しているわけではありません。  
また、個人的な解釈を含めています。
:::

## 受けた被害
改めて、受けた被害についてまとめます。

メール送信には[Amazon SES](https://aws.amazon.com/jp/ses/)を使用しています。
当日、月初であるのにも関わらず、先月よりも高額になるというコストアラートが早くも発砲され、訝しんだ私はマネジメントコンソールに潜りました。
それからAmazon SESのコンソールを見てみると、クオータが54000なのに対して、60000件も送信されているのを発見して、「やられた」と思いながら、まずは `Postfix`を停止しました。  
そのスクショは取り忘れたのですが、下記はCloudWatchのログです。**よく見ると、9月26日にも兆候がありました。**

![](/images/postfix_tuning/0002.png)

被害に気が付き停止してから`Postfix`のキューを見ると、40万件ほど溜まっていました。  

ここで重要なのは、

- 認証情報が漏れたのか
- バウンス攻撃を受けたのか
- リレーとして使われたのか

ですが、おそらく **リレーとして使われた** は少なくともあると思います。  
その根拠が、

- スパムの宛先が複数であること（＝バウンスではなさそう？）
- 実在するユーザ名での送信ではなかったこと

です。


## 行なった対応
攻撃を受け、行なった対応を列挙していきます。  
なお、原因となっていそうな「ネットワーク変更」は、記事を書いているときに気が付き、対応しているときには **localhostになってしまうことは気がついたからどう対策しよう**くらいの状況です。

::: message
最終的に、トンネルは必要だったので残しました。  
一時的にメールサーバをIPv6のみにしたのですが、モバイル回線がIPv4しか使用できなかったためです。  
そのため、出先からメールサーバにアクセスするには、どうしても踏み台の存在が必要不可欠でした。
:::


### サーバの再起動を行う
**不具合があったら再起動しよう**ではないです。  
サーバに対し、不正なセッションが残っている可能性を考慮し、物理的にセッションを破棄するため、再起動を行いました。  

### 認証鍵の再生成
**鍵が漏洩した可能性**を考慮し、すべての鍵を再生成しました。
これには、サーバへのアクセスに使用している鍵だけでなく、EC2の鍵や、GitHubに登録している鍵などを含みます。

### 未使用ユーザの削除
メールを受信するためのユーザとして、マシンには複数のユーザが存在していました。  
これらのユーザは `nologin`シェルを割り当てていたので、SSHでのログインはできないはずですが、SMTPのユーザとしては利用可能です。  
そのため、今回は**本当に必要なアカウントを除いて削除**しました。

### ユーザのパスワードの変更
未使用ユーザを削除したあとに残ったユーザは、パスワードを変更しました。  
最終的には、目的別に5個くらいだったものを、２つにしました。必要があればまた作ります。

### Amazon SESの認証情報の再発行
**Amazon SESの認証情報が漏洩した可能性**を考慮し、既存の認証情報を破棄して新たな認証情報を発行しました。  

### システムスキャン
マルウェアやルートキットの検出を行うため、chkrootkitやrkhunterを用いて**システム全体をスキャン**しました。ClamAVによるスキャンも行いました。  
ただし、ここでわかるのは**既知の攻撃を受けていないはず**ということです。

### Postfixの設定変更
ざっくりと、以下の対応を行いました。詳しくは後述します。この項目が今回の本題です。

- 送信時の検証の強化
- 受信時にSPF検証を行う
- システムユーザに対するメールの破棄
- 存在しないユーザに対するメールの破棄
- SpamAssassin, GreyList, Amavisなどの導入
- RBLのチェック
- レートリミットの設定



## Postfixの設定
具体的にどんなことをしたのかをつらつらと書いていきます。  

### 送信者制約の強化
下記は、対応後の送信側制約です。  


``` : /etc/postfix/main.cf
smtpd_sender_restrictions =
        reject_rbl_client zen.spamhaus.org,
        reject_rbl_client bl.spamcop.net,
        check_sender_access hash:/etc/postfix/sender_access,
        check_policy_service unix:private/sender-policy,
        permit_sasl_authenticated,
        reject_unknown_sender_domain,
        permit
```

まず、以下の項目です。

``` : /etc/postfix/main.cf
reject_rbl_client zen.spamhaus.org,
reject_rbl_client bl.spamcop.net,
```

これらは、リアルタイムブラックホールリスト（RBL）を参照してブロックするための設定です。  
`reject_rbl_client` でRBLを指定することで、ここに登録されているスパム送信者のIPからの送信の場合、拒否することができます。  
今回は、ふたつのリストを適用しています。
**ただし、トンネル側に接続された場合、localhostなので意味をなしません！！**


つづいて、送信者の確認を行います。以下の二項目です。

``` : /etc/postfix/main.cf
check_sender_access hash:/etc/postfix/sender_access,
check_policy_service unix:private/sender-policy,
```

これらは、`sender_access`に従って検証を行うもの（ひとつめ）と、スクリプトなどを使用して検証を行うもの（ふたつめ）です。  
以下のように設定されています。

```: /etc/postfix/sender_access
milkcocoa.info          sender_policy_check
```

`milkcocoa.info`というドメインに対して、検証を行うという設定です。
ここで実行される`sender_policy_check`は、以下のように定義されています。

``` : /etc/postfix/main.cf
smtpd_restriction_classes = sender_policy_check
sender_policy_check = check_policy_service unix:private/sender-policy
```

ではこの `sender-policy`はというと、以下のように定められています。


``` :/etc/postfix/master.cf
sender-policy   unix    -       n       n       -       0       spawn
  user=nobody argv=/usr/bin/python3 /etc/postfix/sender_policy_service.py
```
Pythonスクリプトが割り当てられていますね。
中身は以下のスクリプトです。（長いので折りたたんでいます。）

::: details 送信者検証スクリプト

```python : /etc/postfix/sender_policy_service.py
import sys

def process_request():
    try:
        attributes = {}
        while True:
            line = sys.stdin.readline().strip()
            if line == "":
                break
            key, value = line.split("=", 1)
            attributes[key] = value

        # デバッグ用ログ出力
        with open("/tmp/policy_service.log", "a") as log_file:
            log_file.write(str(attributes) + "\n")

        sasl_username = attributes.get('sasl_username', '')
        sender, domain = attributes.get('sender', '@').split('@', 1)

        if sasl_username and sasl_username != sender:
            # 認証されていて, ユーザ名と送信者が違う
            print("action=REJECT\n")
        else:
            print("action=DUNNO\n")
    except Exception as e:
        with open("/tmp/policy_service_error.log", "a") as error_log:
            error_log.write(f"Error: {str(e)}\n")

if __name__ == "__main__":
    process_request()
    sys.stdout.flush()
```
:::

ざっくりかいつまむと、 認証されている場合、**認証ユーザ**と**送信者**が一致するかどうかの検証です。
~~(改めて設定をよく見ると重複しているので、`milkcocoa.info`のときに二重チェックされ、それ以外のときでもチェックが入ることになっている。)~~

`sender_access`は、`postmap`を使用してハッシュ化しておきます。

```bash
sudo postmap /etc/postfix/sender_map
```


さらに以下の項目では、認証済みのユーザによる送信を許可しています。
``` : /etc/postfix/main.cf
permit_sasl_authenticated
```
ポリシーチェックのあとに持ってきたのは、認証済みでも不正なユーザの場合に弾くようにするためです。  
順序を入れ替えると、認証が通ってしまえば不正なユーザでも通過してしまいます。

その後段で、不明なドメインの送信者を弾いたあとに、最終的には許可をしています。  

``` : /etc/postfix/main.cf
reject_unknown_sender_domain,
permit
```

最終的に許可を出しているのは、例えば `gmail.com` や `yahoo.co.jp`などをホワイトリストに列挙するのはめんどくさく、 **ここまで突破できたら大丈夫だろうという慢心**です。

ちなみにもとの設定は確か `permit_mynetworks`が冒頭に設定されており、自ネットワークで定義されているもの内であれば許可するものなので、 **localhostは問答無用で送信許可されます。**

### 受信者側制約の強化
続いて、受信者側の制約です。


```
smtpd_recipient_restrictions =
        check_recipient_access hash:/etc/postfix/recipient_access,
        reject_unlisted_recipient,
        permit_sasl_authenticated,
        check_policy_service inet:localhost:10023,
        check_policy_service unix:private/policyd-spf,
        reject_unauth_destination,
        reject_unknown_recipient_domain,
        reject_unverified_recipient
```

まずは、以下の項目です。  
いきなり何かしらのファイルを参照していますね。

このファイルは以下のようになっています。（長いので折りたたんでいます。）

::: details 受信者一覧
```: /etc/postfix/recipient_access
daemon@milkcocoa.info           DISCARD
bin@milkcocoa.info              DISCARD
sys@milkcocoa.info              DISCARD
sync@milkcocoa.info             DISCARD
games@milkcocoa.info            DISCARD
man@milkcocoa.info              DISCARD
mail@milkcocoa.info             DISCARD
news@milkcocoa.info             DISCARD
proxy@milkcocoa.info            DISCARD
www-data@milkcocoa.info         DISCARD
nobody@milkcocoa.info           DISCARD
_apt@milkcocoa.info             DISCARD
systemd-network@milkcocoa.info  DISCARD
systemd-resolve@milkcocoa.info  DISCARD
messagebus@milkcocoa.info       DISCARD
systemd-timesync@milkcocoa.info DISCARD
pollinate@milkcocoa.info        DISCARD
sshd@milkcocoa.info             DISCARD
syslog@milkcocoa.info           DISCARD

......
```
:::

ここで列挙しているのは、**このアドレス向けのメールは破棄する** というものです。これを、システムユーザすべてで列挙しています。　　
このファイルを忘れずにハッシュ化しましょう。

```bash
sudo postmap /etc/postfix/recipient_access
```

これを前提に以下の設定を冒頭で行うことで、このリストにあるユーザあてのメールはまっさきに破棄されることになります。

```: /etc/postfix/main.cf
check_recipient_access hash:/etc/postfix/recipient_access,
```

続いて以下の設定では、自分宛てのメールのとき、**マシンに存在しないユーザ向けであれば破棄する**という設定です。

```: /etc/postfix/main.cf
reject_unlisted_recipient
```

先ほどの設定と合わせると、

- マシンに存在していても、システムユーザであれば破棄する
- マシンに存在していなければ、拒否する

となり、自分宛てのメールは存在する一般ユーザのみということになります。

さらに制約は続きます。ひとまずここまで来たら認証済みユーザからのメールは許可しておきましょう。

```: /etc/postfix/main.cf
permit_sasl_authenticated,
```

このあたりの順番は諸説あると思いますが、少なくともこれから述べるポリシーチェックよりは前段に持っていきたいです。すこし早い気もしますが、認証済みのユーザの場合は送信者と認証情報が一致することを送信者側の制約で保証しているので、良しとします。


```: /etc/postfix/main.cf
check_policy_service inet:localhost:10023,
check_policy_service unix:private/policyd-spf,
```
これらは、グレイリスティングとSPF検証を行なっています。（設定方法は後述します。）　　
設定方法や詳しい解説は後ほど行いますが、とくに、SPFチェックよりも `permit_sasl_authenticated`のほうが後段にあると、**使用する可能性のあるクライアントすべてをSPFレコードに書かないといけない**状況になり、すこしめんどくさいです。
そのため、認証済みのユーザでの送信は先に許可しています。


また、この後段で最終的な拒否制約をいくつかかけています。

```: /etc/postfix/main.cf
reject_unauth_destination,
reject_unknown_recipient_domain,
reject_unverified_recipient
```
これらはをざっくり説明してしまうと、

- 外部へのリレー拒否
- 受信者がDNS解決できない場合の拒否
- 受信者が検証できない場合に拒否（外部サーバに対する検証はほぼ必ず失敗するので、外部あてはここまでに突破しておきたい。SASLあたりで。）
です。


受信者制約はこのあたりでしょうか。
こちらも、たしか元々は冒頭に `permit_mynetworks`が入っていたと思います。つまり、はい。

### コンテンツ・フィルタの利用
さらに、最終的に処理されることになったメールは、コンテンツ・フィルタを通すようにしました。  
これによって、スパムと判断されたメールは隔離されたり破棄されたりします。  

ここでは、SpamAssassinとAmavisを使用しています。（設定方法は後述します。）


```: /etc/postfix/main.cf
content_filter = smtp-amavis:[localhost]:10024
```

## 各ツールの導入手順
Postfixの設定で飛ばしたツールの説明や導入に関して、軽く触れます。


```

smtp-amavis     unix    -       -       n       -       2       smtp
    -o smtp_tls_security_level=may
    -o disable_dns_lookups=yes

127.0.0.1:10025 inet    n       -       n       -       -       smtpd
    -o content_filter=
    -o smtpd_recipient_restrictions=permit_mynetworks,reject
    -o smtpd_client_restrictions=permit_mynetworks,reject
    -o mynetworks=127.0.0.0/8
    -o smtpd_tls_security_level=none
policyd-spf  unix  -       n       n       -       0       spawn
    user=nobody argv=/usr/sbin/postfix-policyd-spf-perl
```


### SPF検査
**SPF（Sender Policy Framework**は、メール送信者がなりすましでないかを確認するためのプロトコルです。SPFチェックを行うためにはpolicyd-spfをインストールして、Postfixに設定します。  

まず、インストールします。

``` bash: bash 
sudo apt install postfix-policyd-spf-perl
```

そして、Postfixに登録します。

```: /etc/postfix/master.cf
policyd-spf  unix  -       n       n       -       0       spawn
    user=nobody argv=/usr/sbin/postfix-policyd-spf-perl
```

### グレイリスティングの導入
グレイリスティングは、最初のメール送信を一時的に拒否し、再送を試みるスパムメールとそうでないメールを識別するための手法です。
**一般的なMTAは拒否されたあとに一定時間後に再送するが、スパムメールの場合は再送しない・あるいはすぐに再送するだろう**という仮定のもとにスパムを識別するものです。

``` bash: bash
sudo apt install postgrey
sudo systemctl enable postgrey
sudo systemctl start postgrey
```

### Amavis, SpamAssassinの導入
`Amavis`は、セキュリティツールなどを統括して使用するためのフレームワークで、`SpamAssassin`は、そこで使用するスパムフィルタです。  

まずはインストールします。
```bash: bash
sudo apt install amavisd-new spamassassin
```

続いて、Amavisの設定を行います。

```: /etc/amavis/conf.d/50-user
@bypass_spam_checks_maps = (0);      # SpamAssassinを有効化
$sa_tag_level_deflt = -999;          # スパム情報を全てのメールに付加
$sa_tag2_level_deflt = 5.0;          # スパム判定スコア
$sa_kill_level_deflt = 10.0;         # スパムとして破棄するスコア
```

また、PostfixがAmavisと連携できるようにします。  
2箇所で設定を行います。

コンテンツ・フィルタとしてAmavisを使用するようにします。
```: /etc/postfix/main.cf
content_filter = smtp-amavis:[127.0.0.1]:10024
```

前者はPostfix -> Amavisで、後者はAmavis -> Postfixの設定です。
```: /etc/postfix/master.cf
smtp-amavis unix - - n - 2 smtp
    -o smtp_tls_security_level=may
    -o disable_dns_lookups=yes

127.0.0.1:10025 inet n - n - - smtpd
    -o content_filter=
    -o smtpd_recipient_restrictions=permit_mynetworks,reject
    -o smtpd_client_restrictions=permit_mynetworks,reject
    -o smtpd_tls_security_level=none
```

さらに、SpamAssassinを設定します。

```: /etc/spamassassin/local.cf
required_score 5.0                  # スパム判定スコア
rewrite_header Subject *****SPAM*****  # スパムの件名にタグ付け
use_bayes 1                         # ベイズフィルタを有効にする
bayes_auto_learn 1                  # 自動学習を有効にする
report_safe 1                       # スパム判定されたらもとのメッセージを添付ファイルとして扱う。（手元の環境では、送信されずに破棄されてサーバに圧縮されて残った。）
```

最後に、Amavisたちを起動します。
```bash: bash
sudo systemctl enable amavis
sudo systemctl enable amavis

sudo systemctl enable spamassassin
sudo systemctl start spamassassin
```



Postfixも忘れずに再起動しましょう。

```bash: bash
sudo systemctl restart postfix
```

#### 追記(2024/10/07 23:51)
`SpamAssassin`はデフォルトの状態でもそれなりに動きますが、記事の最後に追記したメッセージはスパムスコア3.1で、スパムと判定されませんでした。  
SpamAssassinが[学習用コーパス](https://spamassassin.apache.org/old/publiccorpus/)を配信しているので、それを使って学習しましょう。  

わたしは上記から、

- 20050311_spam_2.tar.bz2 (スパム)
- 20030228_spam.tar.bz2 (スパム)
- 20030228_easy_ham.tar.bz2 (ハム)
- 20030228_easy_ham_2.tar.bz2 (ハム)
- 20030228_hard_ham.tar.bz2 (ハム)

を学習させました。  

学習には以下のコマンドを使用します。  

```bash: bash
sudo sa-learn --spam /path/to/spam (file or dir)

sudo sa-learn --ham /path/to/ham (file or dir)
```

この状態で同じメッセージを再検査し、スコアは6.8となり無事スパム認定されました。

::: message alert
学習用コーパスで配布されているメッセージを、実際にメールとして流さないように十分に気をつけてください。
:::





## さいごに
いま、26時になろうとしています。早く寝たくてだいぶ駆け足になってしまいました。  

この時代に自前のメールサーバを！？という感じですが、あると便利だと思います。  
が、**うっかり全世界にスパムをばらまかないように**気をつけて運用するようにしましょう。  



この記事で挙げたのは一例であり、完璧ではないと思います。攻撃自体は一過性のものだったかもしれませんが、おかげで再度勉強しなおす機会を持つことができました。
記事には自分なりの解釈も入っていたりするので、内容を鵜呑みにせず自分でもしっかりと調べ、自信のない場合には構築をやめて世にあるサービスを使用しましょう。  


## 追記(2024/10/07 23:51)
1件のスパムメールが貫通してきたので、検索でヒットするように載せておきます。  
スパムフィルタ回避のためか、単語がぶつ切りです。

::: details 貫通してきたメールのボディ
> Hello!
> I am a hac ker who has access to your ope rating system.
> I also have full access to your account.
> I've been watching you for a few months now.
> The fact is that you were infe cted with mal ware through an adu lt site =
> that you visited.
> If you are not familiar with this, I will explain.
> Tr ojan Viru s gives me full access and control over a computer or other =
> device.
> This means that I can see everything on your screen, turn on the camera a=
> nd microphone, but you do not know about it.
> I also have access to all your contacts and all your correspondence.
> Why your antiv irus did not detect mal ware?
> Answer: My mal ware uses the driver, I update its signatures every 4 hour=
> s so that your anti virus is silent.
> I made a video showing how you sati sfy yourself in the left half of the =
> screen, and in the right half you see the video that you watched.
> With one click of the mouse, I can send this video to all your emails and=
> contacts on social networks.
> I can also post access to all your e-mail correspondence and messengers t=
> hat you use.
> If you want to prevent this,
> transfer the amount of=C2=A0 1 300 USD (US dollars) to my bit coin addres=
> s (if you do not know how to do this, write to Google: "Buy Bit coin").
> My bit coin address ( BTC Wall et) is:
> 
> ' bitcoin address '
> After receiving the pay ment, I will delete the video and you will never =
> hear me again.
> I give you 55 hours (more than 2 days) to pay .
> I have a notice reading this letter, and the timer will work when you see=
> this letter.
> Filing a complaint somewhere does not make sense because this email canno=
> t be tracked like my bit coin address.
> I do not make any mistakes.
> If I find that you have shared this message with someone else, the video =
> will be immedi ately distributed.
> Best regards!
:::

また、ヘッダ情報は以下のようになっています。(抜粋)  
メールサーバで色んな所を通過していますが、始まりはロシアのなんかですね（localhostになっているのは例のIPv4用受け皿です。）  
でもってArtStationを名乗っているな


::: details ヘッダ情報
```
Return-Path: <info@artstation.com>
X-Original-To: root@milkcocoa.info
Delivered-To: root@milkcocoa.info
Received: from localhost (localhost [127.0.0.1])
	by mail.milkcocoa.info (Postfix) with ESMTP id AF74C40046
	for <root@milkcocoa.info>; Mon,  7 Oct 2024 12:07:20 +0000 (UTC)
Received: from mail.milkcocoa.info ([127.0.0.1])
	by localhost (mail.milkcocoa.info [127.0.0.1]) (amavisd-new, port 10024)
	with ESMTP id c49Gd37MxXCT for <root@milkcocoa.info>;
	Mon,  7 Oct 2024 12:07:19 +0000 (UTC)
Received: from linkmasters.ru (localhost [127.0.0.1])
	by mail.milkcocoa.info (Postfix) with ESMTPS id 052BA40045
	for <root@milkcocoa.info>; Mon,  7 Oct 2024 12:07:18 +0000 (UTC)
Message-ID: <a45016bf4b46df2d0ea0399266f3a9a3956d04a2@artstation.com>
From: Manuel Ruiz <info@artstation.com>
```
:::
