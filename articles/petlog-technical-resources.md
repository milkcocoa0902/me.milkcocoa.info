---
title: "ペットSNS「ぺったん」を支える技術（バックエンド編）"
description: ''
date: '2023-07-19T23:39:00.000+09:00'
emoji: "📑"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
    - Ktor
    - Exposed
    - Firebase
    - Kotlin
published: false
---

## この記事はなに？
だいぶ前にリリースした『ペット飼い向けSNS「ぺったん」』の技術記事を、今更ながら **丁寧に** 書いてみようという記事です。

## 「ぺったん」って？
そもそもの話ですね。  
ぺったんとは、主にペット飼いをターゲットにしたSNSです。もちろんペットを飼っていなくても、誰かが投稿したペット画像を閲覧できたりします。投稿できるのはペットオーナーのみです。  

宣伝を全くしていないのでユーザがいません。やる気あんのか？？

## 使用技術
ということで本題の、技術構成に関して。  

### 使用技術（ざっくり）
まずは、ざっくり構成図です。モノとFWといろいろが混ざってますね。。。  
これを見てもらったあと、掘り下げていこうかなと。

![](/images/petlog-technical-resources/01_system_structure.png)


|名称|概要|利用シーン|
|:---:|:---:|:---:|
|Ktor|Kotlin製のWebアプリフレームワーク！！|WebAPI作成の根幹|
|Exposed|Kotlin製のORM|APIとDBの橋渡し|
|Redis|言わずとしれたインメモリDB|API内でのPUB/SUB|
|Firebase Authentication|大人気、Firebaseの認証基盤|ユーザ認証|
|Cloud Storage for Firebase|Firebaseのストレージサービス|画像の保存|
|Firebase Messaging|便利だよね、FCM|ユーザへの通知|


## APIの根幹
### まずは言語選定
APIを作成していく上で、まずは言語の選定が必要になってきます。  
いまでこそ、  
　PythonではFastAPIやDjangoなど  
　C#ならASP .Net Core  
　JavaだとしてもSpring  
　Node.js、Deno、Golangや、人によってはRustもありか？
とにかく多種多様な選択肢が存在します。  
かく言う筆者も、業務では規模や目的に応じてFastAPIやDjangoを使っていたり、ときにはNode.jsを使ったりしてバックエンドのシステムを構築しています。  
が、一番使い慣れている言語がKotlinなので、今回の開発ではKotlinを選択しました。

### Ktor
Kotlinの開発元であるJet Brains社が手掛けている、Kotlin純正のWebアプリケーションフレームワークです。  
比較的新しいですが、公式を読んでいてもそれなりに使えそうなので採用しました。  
特徴としては
- 軽量である
- 拡張しやすい
- 非同期ベースで動作する

といったあたりを謳っているそうです。ほんまに？


#### 使用感
他の言語のFWに例えるとなにに近いかな。カスタム無しで使うと、ORMもなにも入っていないので、コアは本当に「エンドポイントを作成するもの」って感じ。シリアライズとかもモジュールを追加していかないといけないので、Flaskって感じ？


#### 拡張性、本当にある？
モジュールを追加していくと、

- いい感じに認証できたり
- いい感じにエラーハンドルできたり
- いい感じにDBを扱えたり（これはKtorの範疇ではないが）

と、いろいろと便利になる。痒いところに手が届かない場合、自分でプラグインを書いて導入することもできます。Firebase認証を使いたい時とか。

### Exposed
これまたJet Brains社が手掛けているORMです。いろんなDBに対応しています。らしいです。
先に感想を言ってしまうと、こちらに関してはまだ発展途上かな、と言った感じもします。筆者の使い方が悪いだけの可能性はかなり高いです。  

#### 使用感

##### DB定義
まず、基本的な機能は十分に備わっています。DAOとDSLどちらも扱うことができますが、筆者はDAOを好んで使っています。  

例えばUUIDのIDを持つテーブルが欲しいとき、以下のように記述していくと、なにも迷うことがなく作成できます。ちなみにDB的には `binary(16)` になります。

```kotlin : users.kt
object users : UUIDTable() {
    var username = varchar("username", 32)
    var email = varchar("email", 256)
    var icon = varchar("profile_image", 512).nullable()
}
```

簡単ですね。ただ、「ぺったん」で最近考慮漏れしていることに気がついた、とあるテーブルを複合主キーにしてないとだめだったな。。。。ということがあり、これはどうするかというと、


```kotlin : MultiplePrimaryKeyTable.kt
open class MultiplePrimaryKeyTable(
        name: String = "", 
        private val mainKeyColumnName: String = "id", 
        private val subKeyColumnName: String = "sub_id"
    ) : IdTable<Long>(name) {
        override val id: Column<EntityID<UUID>> = long(mainKeyColumnName).clientDefault { UUID.randomUUID() }
        val sub_id: Column<UUID> = uuid(subKeyColumnName).clientDefault { UUID.randomUUID() }

        override val primaryKey: PrimaryKey by lazy { super.primaryKey ?: PrimaryKey(id, sub_id) }
}
```

のようなことをしなくてはいけません。

::: message alert
実際にこのコードが動くかどうかは試していません。  
実際のコードに存在している拡張テーブルとIntelliSenseをもとに、こんな感じだろう、と書いているだけです。
:::

が、逆に言うとこのようなことをする必要がなければあまり困りませんし、拡張がしやすいと取れるわけでもあります。

##### マイグレーション周り
DBへの接続が確立している前提で

```kotlin : create_table.kt
transaction {
    arrayOf(
        users,
    ).let { tables ->
        create(*tables)
    }
}
```

のようなコードを発行してあげれば、新たにテーブルを作成してくれます。ただし、この方法だと新たに追加したテーブルは作成されなくて、別途方法があったはずです。  
Djangoとかのマイグレ自動生成に慣れていると、このあたりは不便に感じるかもしれません。個人的には、DB管理は別のツールでやって、ExposedはORMとしての立ち位置に集中するのがよいのかなと思います。  

ちなみに、[DBからExposedのコードを生成する方法](https://bettercoding.dev/kotlin/tutorial-exposed-generation-flyway/)はあるみたいです。 flywayにもちゃっかり触れていますね。

## Firebase Authentication
知らない人のために話しておくと、Firebaseってやつが提供している認証基盤です。IDaaSってやつです。なんでも as a Serviceって言えばいいと思ってない？  

ぺったんでは、

- Google
- Facebook
- 匿名認証

というものを利用しています。（2023/11/15現在）  
筆者の独断と偏見で決めています。

ちなみにApple向けのアプリで外部ログインを使用する場合には、Apple IDでのログインができることを必須としているみたいですね。

## Cloud Storage for Firebase
こちらもFirebaseが提供するストレージサービスです。  
5GBまでは無料で、DL量も毎日1GBまでは無料の範囲で使えます。つまり、利用者が少ないうちは無料で使うことができそうですね。  
ぺったんは画像を扱うサービスですので、ここに画像を置くことにしています。  

きちんとルールを書いてあげることで、例えばFirebaseの認証情報がリクエストヘッダにないとデータの取得もできないようにしたりできます。安心ですね。  
また、読み込みをパブリックにしてあげるとCDNみたいな感じの動作をするらしいです。本当かどうかは知りません。

### 使用感
まぁ便利だけど、ちょいとクセがあるかも。  
例えば、この手のサービスにはありがちですが、署名付きURLの発行が可能です。署名発行時に期限を指定しますが最長で7日間らしく、 **ぺったんはローカルにデータをキャッシュして次回起動時はあたかも前回の続きかのように振る舞う** ので、仕様不適格でした。  
なぜなら、次回起動時に署名期限が切れていて、（画像キャッシュはLRUなので）画像キャッシュも切れていたら画像が取得できないことになります。致命的ですね。

::: message
ローカルにキャッシュさせないで使う場合には、API問い合わせ時にDBに保存されている署名付きURLの期限を見て、期限内だったらそのまま返して、期限切れだったらURL再生成、のようにするのが良いでしょう。  
あるいは、期限を一緒に保存しておくとか。
:::


そこで、リクエストヘッダに認証情報をつけて、URLには署名をつけないことにします。  
このとき、URLは以下のようになります。

```
val backetName = "project-vf65avd"
val fileName = "/john/image/profile_image.jpg"

"https://firebasestorage.googleapis.com/v0/b/${backetName}/o/${URLCodec(Charsets.UTF_8.displayName()).encode(fileName)}?alt=media"
```

`alt=media` 、これめちゃくちゃ重要で、これがないとファイルを示すxmlが帰ってきます。jsonだったかも。とにかく画像ではなくなってしまいます。  
また、バケット内のパスは `/`で表現されますが、これをそのままURLにしようとしても404になるので、（主に `/` を）いわゆるパーセントエンコーディングしてあげます。  
こうすることで、ファイルを画像として取得するURLを組み立てることができます。



.......
.......完全に私事ですが、もう夜も遅くなってきた（25時）し、別の日に持ち越すのも嫌なので、ひとまずこれで公開します。。。。。ぼちぼちと編集するかもしれません。