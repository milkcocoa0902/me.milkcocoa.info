---
title: "Kotlinでログツールを作っている話2"
description: ''
date: '2023-12-28T17:30:00.000+09:00'
emoji: "🌊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
- Kotlin
- 個人開発
- ライブラリ
- Slack
published: true
---



## この記事はなに？
前回紹介したKotlin製ログツールの、もう一歩踏み込んだ使い方紹介みたいな感じのなにかです。
https://zenn.dev/milkcocoa0902/articles/develop-kotlin-logtool


## Slackにログを吐いてみる
SlackではIncomming Webhookを使って、HTTP経由で投稿をすることができます。
今回は、ログツールをカスタムしてSlackに同時にログを流し込んでみます。


### 環境
- Java 11
- Kotlin 1.9.21
- colotok 0.1.6

### 導入する
さて、まずは必要な依存関係を解決していきます。

```Kotlin: build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.21"
    // 追加
    kotlin("plugin.serialization") version "1.9.21"
}

repositories {
    mavenCentral()
    // 追加
    maven(url =  "https://jitpack.io" )
}


dependencies {
    // 追加
    // colotok本体
    implementation("com.github.milkcocoa0902:colotok:0.1.6")
    

    // 追加
    // HTTP#POST
    implementation("com.github.kittinunf.fuel:fuel:2.3.1")
    implementation("com.github.kittinunf.fuel:fuel-coroutines:2.3.1")
    
    // 追加
    // シリアライザ用
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
}
```

::: message alert
`kotlinx-serialization`周りのライブラリ、本来は必要ありませんが、今回`SlackProvider`を作る上で必要になります。
筆者のKotlin力が低いため。。。。
`KSerializer<T>`が解決できれば良いので、pluginはいらなくない？それにJSON用のを入れなくても `KSerializer<T>`あたりのIFだけ公開しているものがありそう。
:::


### Slackに吐くための実装をする
`colotok`標準ではSlackにログを吐き出すことはできません。が、`Provider`を継承してあげることで、Slackに吐き出すことが可能になります。
便宜上、`SlackProvider`と呼ぶことにします。その実装はおおよそ以下のようになります。

:::: details SlackProviderの実装
```Kotlin: SlackProvider
class SlackProvider(config: SlackProviderConfig): Provider {

    constructor(config: SlackProviderConfig.() -> Unit): this(SlackProviderConfig().apply(config))

    class SlackProviderConfig() : ProviderConfig {
        var webhook_url: String = ""

        override var logLevel: LogLevel = LogLevel.DEBUG

        override var formatter: Formatter = DetailTextFormatter

        /**
        * no effect
        */
        override var colorize: Boolean = false
    }

    private val webhookUrl = config.webhook_url
    private val logLevel = config.logLevel
    private val formatter = config.formatter

    // テキストログ用のフォーマッタを指定したときに呼び出される
    override fun write(name: String, msg: String, level: LogLevel) {
        if(level.isEnabledFor(logLevel).not()){
            return
        }
        kotlin.runCatching {
            webhookUrl.httpPost()
                .appendHeader("Content-Type" to "application/json")
                .body("""
                {"text": "${formatter.format(msg, level)}"}
                """.trimIndent())
                .response { _, _, _ -> }
        }.getOrElse { println(it) }
    }

    // 構造化ログ用のフォーマッタを指定したときに呼び出される
    override fun <T : LogStructure> write(name: String, msg: T, serializer: KSerializer<T>, level: LogLevel) {
        if(level.isEnabledFor(logLevel).not()){
            return
        }
        kotlin.runCatching {
            webhookUrl.httpPost()
                .appendHeader("Content-Type" to "application/json")
                .body("""
                {"text": "${formatter.format(msg, serializer, level)}"}
                """.trimIndent())
                .response { _, _, _ -> }
        }.getOrElse { println(it) }
    }
}

```
::::

さて、要点を見ていきましょう。

#### コンフィグを実装する
コンフィグとは、以下の部分を指します。

:::: details コンフィグの実装
```Kotlin: SlackProvider.kt#SlackProviderConfig
class SlackProviderConfig() : ProviderConfig {
    var webhook_url: String = ""

    override var logLevel: LogLevel = LogLevel.DEBUG

    override var formatter: Formatter = DetailTextFormatter

    /**
    * no effect
    */
    override var colorize: Boolean = false
}
```
::::

ある程度一般化した `ProviderConfig` インターフェースがあるので、それを使うと便利かもしれません。使わなくても問題ありません。
`colotok`では、こういった実装を推奨しています。

ここでは、デフォルトのものに加えて、 `webhook_url`を受け取れるようにしています。


### 実際の書き出し処理を実装する
続いて、実際にSlackに投稿する部分を書いていきます。具体的には、`write`メソッドの中身を書いていきます。
テキストログも構造化ログもだいたい同じような内容になるので、片方だけ抽出すると、以下のようになります。

:::: details Slackに投稿する部分の実装
```Kotlin: SlackProvider.kt#write()
// テキストログ用のフォーマッタを指定したときに呼び出される
override fun write(name: String, msg: String, level: LogLevel) {
    if(level.isEnabledFor(logLevel).not()){
        return
    }
    kotlin.runCatching {
        webhookUrl.httpPost()
            .appendHeader("Content-Type" to "application/json")
            .body("""
            {"text": "${formatter.format(msg, level)}"}
            """.trimIndent())
            .response { _, _, _ -> }
    }.getOrElse { println(it) }
}
```

::::

さて、特に難しいことはしていません。
`LogLevel`クラスには`isEnabledFor(level: LogLevel)`というメソッドが生えており、これを使うことで、今回の呼び出しが有効かどうか判断することができます。
指定したログレベル以上のレベルの呼び出しであれば`true`を、そうでなければ`false`を返すので、`false`であればなにもする必要がないですね。


そして、肝心のSlackに投稿する部分ですが、こちらは `webhook_url`に対して **`{"text": "something text to post"}`** のような形式のJSONを送ってあげることで実現することができます。


### 使ってみる
今回実装した `SlackProvider`は、以下のように使用することができます。
ここでは、`DEBUG`レベル以上のログをコンソールに、`WARN`レベル以上であればSlackにも流すようにしてみます。

:::: details 使い方
```Kotlin: Main.kt

fun main(){
    val logger = LoggerFactory()
    .addProvider(ConsoleProvider{
        formatter = SimpleTextFormatter
        logLevel = LogLevel.DEBUG
    })
    .addProvider(SlackProvider{
        webhook_url = "<your slack webhook url>"
        formatter = DetailTextFormatter
        logLevel = LogLevel.WARN
    })
    .getLogger()

    logger.trace("TRACE LEVEL LOG")
    logger.debug("DEBUG LEVEL LOG")
    logger.info("INFO LEVEL LOG")
    logger.warn("WARN LEVEL LOG")
    logger.error("ERROR LEVEL LOG")
    Thread.sleep(5_000)
}
```
::::

使い方は簡単ですね。他のProviderと同じように `addProvider(provider: Provider)`を呼び出してあげるだけです。

これを実行すると、以下のようになります。

|コンソール出力|Slack出力|
|:---:|:---:|
|![](/images/develop-kotlin-logtool2/01_console_provider_log.png)|![](/images/develop-kotlin-logtool2/02_slack_provider_log.png)|

コンソールには`DEBUG`以上のものが流れ、Slackには`WARN`レベル以上のものが流れていることがわかります。

::: message
`main`の最後で `Thread.sleep(5_000)`をしているのは、SlackへのHTTP#POSTを待ち合わせるための適当な時間です。
これをしないと、今回の場合はSlackに流れる前にプログラムが終了してしまいます。
:::

## さいごに

今回のサンプルはこちらにおいています。
https://github.com/milkcocoa0902/colotok_slack_integration_sample

ツールはまだまだ開発途上ですが、よかったらスターをいただけると嬉しいです。
https://github.com/milkcocoa0902/colotok

開発のモチベーションは、**コードベースでログの設定が書けると嬉しいなぁ** です。

xmlやらの外部リソースでログの振る舞いを変えるの、差し替えるときに再コンパイルの必要がないなどのメリットもあると思っていて、プロジェクトが肥大化していくほどその恩恵は大きいでしょうが、最近は並列ビルドだったりビルドキャシュだったり、ビルドシステムそのものがだいぶ優秀になってきているので、そのメリットを差し置いてもコードで設定が色々書けると嬉しいなと、個人的に思っています。