---
title: "Kotlin向けロギングライブラリ「Colotok」の様々なユースケース"
emoji: "💭"
description: ''
date: '2025-07-08T21:25:00.000+09:00'
type: "tech" # tech: 技術記事 / idea: アイデア
topics:
  - Kotlin
  - 個人開発
  - ライブラリ
  - Logging
published: true
---

::: message
本記事はJetBrains社の提供するJunieを用いて推敲しております。  
「さいごに」のセクションは空欄にしていたら真面目なことを書かれたので、全削除して書き直しました。
:::


こんにちは、ここあです。  
今年はすでに梅雨明けしている地域も多くあり、早くも夏到来といった感じでだいぶ暑くなってきましたね。  

さて、今回の記事では、Kotlin向けに開発しているロギングライブラリ「Colotok」の様々なユースケースを紹介していきたいと思います。  

https://github.com/milkcocoa0902/Colotok

過去の記事でも何度か触れているように、Kotlin/JVMだけでなく、Kotlin/NativeやKotlin/JSなど、いわゆるKMPで利用することを念頭においたロギングライブラリとなっています。  
デフォルトでもコンソールやファイル、各種ストリームへの出力に対応していますが、今回の記事ではクラウドサービスへの出力であったり、既存のJava/Kotlinプロジェクトへの統合について紹介していきます。  


## SLF4Jバックエンドとして使用
Javaでは古くより多種多様なロギングライブラリが開発されてきました。  
それに対応するべくSLF4Jという汎用APIが整備され、フロントはそのままでログ出力のバックエンドを差し替えるような仕組みが使えるようになりました。  
そんな背景もあり、SLF4Jを使用しているJava/Kotlinプロジェクトは多くあると思います。

Colotokは、SLF4Jのバックエンドとして使用することができます。  
これの意味するところは、例えばいままでSLF4J + Logbackを使用していたとして、これをそのままSLF4J + Colotokという構成に置き換えることができます。    
つまり、ログを出力している箇所の変更をせずにバックエンドを切り替えるというSLF4Jのメリットを最大限に活かすことができます。  

Colotokの設計において、SLF4Jに依存しない独自の出力システムを採用したことで、このような柔軟な統合が可能になりました。  

```kotlin:build.gradle.kts
implementation("io.github.milkcocoa0902:colotok-slf4j:0.3.3")
```

実際のログ出力は、SLF4Jの標準的なAPIを使用して行います。

```kotlin:LoggingExample.kt
import org.slf4j.LoggerFactory

class MyService {
    private val logger = LoggerFactory.getLogger(MyService::class.java)

    fun doSomething() {
        logger.info("処理を開始します")
        try {
            // 何らかの処理
            logger.debug("中間状態: データ処理中")
            // 処理完了
            logger.info("処理が正常に完了しました")
        } catch (e: Exception) {
            logger.error("エラーが発生しました", e)
        }
    }
}
```

このように、通常のSLF4Jを使用したコードはそのままで、バックエンドをColotokに切り替えることができます。


## AWS CloudWatchへの出力
AWSを使用している場合、CloudWatch Logsへログを出力することも多くあると思います。  
ColotokはProviderという単位で出力先を任意に差し替えることができます。  
もちろん開発者の皆様で自由にProviderを実装していただくことも可能なのですが、公式ProviderとしてAWS CloudWatchをサポートするようになりました。  

```kotlin:build.gradle.kts
implementation("io.github.milkcocoa0902:colotok-cloudwatch:0.3.3")
```

```kotlin:CloudWatchSetup.kt
val logger = ColotokLoggerFactory()
    .addProvider(CloudwatchProvider{
        this.credential = CloudwatchCredential.Default(
            region = "us-east-1",
        )
        this.logBufferSize = 20
        this.logGroup = "colotok"
        this.logStream = "2025-06-22"
    })
    .addProvider(ConsoleProvider())
    .getLogger()
```

これですべてのログをCloudWatchに集約することができますね。実際のログ出力は以下のように行います。

```kotlin:CloudWatchLogging.kt
class CloudWatchExample {
    fun performOperation() {
        logger.info("CloudWatchへのログ出力テスト")

        // 構造化ログの出力
        logger.info("ユーザー操作", mapOf(
            "userId" to "12345",
            "action" to "login",
            "timestamp" to System.currentTimeMillis()
        ))

        try {
            // 何らかの処理
            logger.debug("処理中のデバッグ情報")
        } catch (e: Exception) {
            logger.error("エラーが発生しました", e)
        }
    }
}
```

CloudWatchに送信されたログは、AWSコンソールから確認することができます。バッファサイズを設定することで、ログの送信頻度を調整することも可能です。

::: message alert
現状、AWS SDK for Kotlinを使用しており、当該ライブラリはJVM/Androidを対象としています。  
そのため、colotok-cloudwatchは上記のプラットフォームでしか使用することはできません。  
:::

## Grafana Lokiへの出力
Grafana Lokiとは、Grafanaが提供する水平スケーラブルで可用性の高いログ集約バックエンドです。Prometheusと同じラベルベースのアプローチを採用しており、ログデータの効率的な保存と検索を実現しています。特に大規模なシステムでのログ管理に適しており、Kubernetesなどの環境と相性が良いことで知られています。

Colotokの公式ProviderはLokiにも対応しており、簡単な設定でログをLokiに送信することができます。これにより、Grafanaのダッシュボードを通じて視覚的にログを分析することが可能になります。  


```kotlin:build.gradle.kts
implementation("io.github.milkcocoa0902:colotok-loki:0.3.3")
```


```kotlin:LokiSetup.kt
val logger = ColotokLoggerFactory()
    .addProvider(LokiProvider{
        level = LogLevel.INFO
        formatter = DetailStructureFormatter
        bufferSize = 50
        host = "https://aaaaaa.bb.cc"
        credential = Credential.Basic(
            username = "user",
            password = "password",
        )
        logStream = mapOf(
            "app" to "colotok",
            "region" to "KIX"
        )
    })
    .addProvider(ConsoleProvider())
    .getLogger()
```

設定が完了したら、以下のようにログを出力することができます。

```kotlin:LokiLogging.kt
class LokiExample {
    fun executeTask() {
        // ラベル付きのログ出力
        logger.info("タスク開始", mapOf(
            "taskId" to "task-123",
            "priority" to "high"
        ))

        // 処理の進捗状況をログに記録
        for (i in 1..3) {
            logger.info("処理ステップ $i 実行中")
            // 何らかの処理
        }

        // エラーハンドリング
        try {
            // 例外が発生する可能性のある処理
            throw RuntimeException("テスト例外")
        } catch (e: Exception) {
            logger.error("タスク実行中にエラーが発生しました", e, mapOf(
                "errorCode" to "E1001",
                "recoverable" to "true"
            ))
        }

        logger.info("タスク完了")
    }
}
```

Lokiに送信されたログは、Grafanaのダッシュボードを通じて検索・可視化することができます。ラベルを活用することで、効率的なログのフィルタリングが可能になります。


## さいごに

ログって大事。  
でもね、ログの出し過ぎで必要な情報が埋もれないようにしようね