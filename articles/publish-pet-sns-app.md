---
title: "ペット関連のアプリをリリースした話（宣伝）"
description: '自作のAndroidアプリ「ぺったん」のリリース告知とともに、技術スタックやアカウント削除時のデータ整合性確保、画像からの位置情報削除といった開発上の工夫や課題について紹介しています。'
date: '2023-07-06T23:39:00.000+09:00'
emoji: "🐈"
type: "tech" # tech: 技術記事 / idea: アイデア
topics:
  - 個人開発
  - Android
  - Kotlin
  - 宣伝

published: true
---

こんにちは、ここあです。  
宣伝がメインの記事ですが、技術要素も交えていこうかと。

# どんなアプリ？
冒頭でいきなりですが、「[ぺったん](https://play.google.com/store/apps/details?id=com.milkcocoa.info.petlog)」というアプリを開発しました。  
実はリリースしたのは3月なのですが、当時は機能がまだ充実していなく、大々的に宣伝もしていなかったのでユーザはほとんどいないと言ってしまっても良いくらいです。

ところで最近、Twitter改変だとか、Mastdonが注目を得ていたり、MetaがThreadsを出したりといろいろとSNS界に激震が走ってきていますね。

こんなタイミングで告知をしても「またぽっと出のSNSか。。。」みたいになりそうといえばなりそう。

----

閑話休題  

このアプリの想定ユーザは、

- ペットを飼っている人
- 動物が好きな人

で、今のところ

- 画像を投稿したり
- コメントしたり
- いいねしたり
- フォローしたり

できます。
ちなみに「フォロワー」という概念を持たないので、「フォロー」というより「サブスクライブ」ですね。FF比みたいな概念から抜け出したかったので

言ってしまえばニャンスタグラムとかそのあたりが近いです。猫を飼い始めて、作りたくなったので作りました。  


# 採用技術

以下の図に示すようなものを使っています。  
殴り描きで、関係を示す線を何も引いていません。雰囲気で感じ取ってください。
![技術スタック](/images/publish-pet-sns-app/petlog-android-tech-architecture.png)


サーバサイドでは以下の技術を使っています。  
とりあえず列挙するとこんな感じです。うまいこと説明がかけなかったので「それはそう」みたいな用途しか書いていません。

|名称|用途|
|:---:|:---:|
|Ktor + Exposed|JetBrains社製のWebアプリケーションフレームワークとO/Rマッパー|
|MariaDB|データの格納。それはそう|
|Cloud Storage for Firebase|主に画像置き場|
|Firebase Authentication|認証基盤|
|Firebase Crashlytics|クラッシュログの収集|
|Firebase Cloud Messaging|ユーザアクションのPUSH通知|
|Redis|キャッシュ|


## 困った箇所
### アカウント削除問題

アカウント削除のときに、削除を保証する方法が少し困りました。  
認証基盤と画像データはFirebase(それぞれ別のサービス)にあり、それ以外の各種データはオンプレにあります。  
このとき正常にことが運べばよいのですが、例えばFirebase Authからデータを消し、ユーザデータの削除にコケたとき、どうしましょう？  
これをすべて一連のトランザクションで行い、コケたらロールバックする、みたいにできたら良いかもしれません。が、いろいろ横断しているのでそれもできません（知らないだけかも）  
Twitterのように「30日後に消える」みたいなものはまた別の話ですね。即座にアカウントにアクセスできなくなるかどうかの違いなので、解決策足りえません。  

ではどうしたかというと、

1. transaction start
2. ユーザの各種レコード削除
3. Firebase Authのレコード削除
4. transaction commit
5. Cloud Storageのデータ削除
6. コケたらRedisに記録

としています。

つまりアカウント削除までは保証し、画像など、Cloud Storageに置かれたデータに関しては「即時の削除」を保証していません。（削除画面にも、「通常1週間以内に削除されます」のように書いています。）
ここで登場するのが[キースペース通知](https://redis-documentasion-japanese.readthedocs.io/ja/latest/topics/notifications.html)です。  リンク先を読んでもらえばわかるのですが、一言で言ってしまうと、Pub/Sub機能です。  
概ね下記のような使い方をしています。

1. Cloud Storageの削除にコケたら、それがわかるような形式でRedisに期限付きでレコードを書き込む（今回は1日期限）
2. キーの期限切れを受け取ったら、それを使ってCloud Storageのデータ削除を再試行する
3. 削除に失敗したら、同じものをRedisに書き込む

このようにしておくと、1週間であれば理論上7回実行されることになるので、よほどでない限り削除されているでしょう。

::::details 理論上と言っている理由がこれです（引用したら長かったので折りたたんでいます。）

>time to live が関連づけられたキーは、Redis により 2 つの方法で expire されます。
>あるコマンドでキーがアクセスされ、すでに expire されていることに気づいたとき
>
>一切アクセスされなくなったキーを集めるため、expire されたキーをひとつずつ探すバックグラウンドシステムを介して。
>
>‘expired’ イベントは、上記いずれかのシステムによりキーがアクセスされた時に生成されます。したがって、キーの time to live の値がゼロに達したタイミングで Redis サーバーが ‘expired’ イベントを生成するという保証はありません。
>
>対象のキーに対してコンスタントにコマンドが実行されず、また TTL が関連づけられたキーが多く存在する場合、time to live がゼロに達したタイミングと ‘expired’ イベントが生成されるタイミングの間には、大きな遅延が発生する可能性があります。
>
>基本的に、’expired’ イベントは Redis サーバーがキーを削除したときに生成され 、理論上において time to live の値がゼロに達したときに生成されるものではありません。
::::

### DBのバージョン管理

Djangoとか、そのあたりを使っているとDBのバージョンらへんが簡単に管理できて嬉しいですよね。 
この機能、Exposedには存在していません。 
flywayを導入すれば良かったと気がついた頃にはときすでに遅しで、実はまだ未解決の問題なのですが。  

......自分でマイグレーション用のスクリプトを書けばいいですよね、如何にしてサボろうかなの気持ちでいるので。

### 画像の位置情報を消そう

厳密には困りポイントではないんですが、重要なとこですね。  
アプリの特性上、アップロードされる画像に位置情報がついている場合、ほとんどの場合はユーザの自宅になるわけです。  
画像をユーザが保存できないのであればまだ良かったのですが、画像保存機能を実装したということもあり、また将来的にWebを展開することを考えると必須の機能ですね。  

[Apache-Commons-Imaging](https://commons.apache.org/proper/commons-imaging/)と、こんな感じのコードを用意して、アップロードされてきた画像から位置情報のメタデータを削除しています。コードに無駄があったとしても、本番で動いてしまっているのでお構いなしで。

``` kotlin
fun ByteArray.removeLocationMetadata(): ByteArray {
    val metaData = Imaging.getMetadata(this) ?: return this
    return (metaData as? JpegImageMetadata)?.let { jpegImageMetadata ->
        jpegImageMetadata.exif?.outputSet?.apply {
            gpsDirectory?.fields?.forEach { gpsTag ->
                removeField(gpsTag.tag)
            }
            findField(ExifTagConstants.EXIF_TAG_GPSINFO)?.let {
                removeField(ExifTagConstants.EXIF_TAG_GPSINFO)
            }
        }.run {
            ByteArrayOutputStream().use { baos ->
                BufferedOutputStream(baos).use { bos ->
                    ExifRewriter().updateExifMetadataLossless(this@removeLocationMetadata, bos, this)
                }
                baos.toByteArray()
            }
        }
    } ?: kotlin.run {
        this
    }
}

```

# おわりに

ペットを飼っている人もそうでない人も、絶賛ユーザ募集中なのでよかったら試してみてください。  

[![Google Play で手に入れよう](https://play.google.com/intl/ja/badges/static/images/badges/ja_badge_web_generic.png =200x)](https://play.google.com/store/apps/details?id=com.milkcocoa.info.petlog&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1)

[Web版](https://petlog.milkcocoa.info/about)