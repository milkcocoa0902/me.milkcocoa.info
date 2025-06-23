---
title: "KMP向けロギングライブラリ「Colotok」をアップデートしました"
emoji: "😺"
description: ''
date: '2025-06-23T23:55:00.000+09:00'
type: "tech" # tech: 技術記事 / idea: アイデア
topics:
  - Kotlin
  - 個人開発
  - ライブラリ
  - Logging
published: true
---

こんにちは。  
以前、Kotlinでロギングツールを作成した話をしていたのですが、覚えておいででしょうか？

https://zenn.dev/milkcocoa0902/articles/develop-kotlin-logtool
https://zenn.dev/milkcocoa0902/articles/develop-kotlin-logtool2

これらの記事を書いてからそれなりに経過しましたが、最近ちょこちょことアップデートをしています。  


## 特徴
改めてまずはColotokの特徴に触れていきます。  

- KMP対応
- 出力先のカスタム可能
- 出力フォーマットのカスタム可能
- SLF4Jのバックエンドとして使用可能（JVMのみ）
- MDC


おおきくこんなところでしょうか。  

### 出力先のカスタム
どういうことかというと、

- 標準出力にのみ出力するのか
- ファイル出力するのか
- あるいはSlackなど、ネットワーク越しに出力するのか

などを設定することができます。  
もちろん複数に同時出力可能です。  

Colotokでは、 `Provider`という単位で出力先を定義します。  
ビルトインでは標準出力・ファイル・ストリームに対応していますが、カスタムすれば上述の通りSlackなどにも出力できます。  
最近、Amazon CloudWatch向けのプラグインも配信開始しました。もちろんこのようなケースにも対応しています。  

### 出力フォーマットのカスタム
これもロギングツールにはあって当然の機能なのでいまさらなのですが、書式を自分でカスタムすることができます。  
またテキスト形式のみでなくJSON形式、いわゆる構造化されたログも出力することができます。  
Colotokでは `Formatter` という単位で書式を定義しており、 `TextFormatter`, `StructuredFormatter`が使用いただけます。　　

- `TextFormatter` … ログを人間向けの書式で出力
- `StructuredFormatter` … JSON形式の構造化ログとして出力

用途は思い浮かびませんが、 `BinaryFormatter: Formatter`なんてものを実装すれば、バイナリ形式でログを記録することも可能です。  

### SLF4Jのバックエンドとして使用
SLF4J、JVMでは採用されているケースも多いですよね。  
例えばKtorではSLF4J+LogBackが一般的かと思います。というのもKtorにはSLF4Jがすでに内蔵されています（※サーバサイド）。そうなってくると、SLF4Jを使うしかないですよね。  
ということで、ColotokのSLF4Jプラグインを使用することで、フロントはそのままで出力先をColotokにすることができます。  

### MDC
ログへコンテキストを埋め込む機能といえばよいでしょうか  
例えば以下のように実行します。
```
MDC.put("userId", "user1234")
logger.info("accessed")
```

すると、以下のように置き換えられて出力されます。

```
2025-06-23T14:00:00 [INFO] userId=user1234 - accessed
```

## 使い方

基本的な使い方は今までと変わりません。  

```kotlin: LoggerSample.kt 
val logger = ColotokLoggerFactory()
    .addProvider(ConsoleProvider{
        this.formatter = SimpleTextFormatter
        this.level = LogLevel.DEBUG
    }).getLogger()

logger.info("something")

logger.error("something error")
```

上記を実行すると以下のように出力されます。

![](/images/colotok-update-0-3-2/0001.png)

### 出力フォーマットのカスタム
また、出力フォーマットを変えたいときには以下のようにします。  

```kotlin: LoggerSample.kt
val logger = ColotokLoggerFactory()
    .addProvider(ConsoleProvider{
        this.formatter = object: TextFormatter("""
            ${Element.DATETIME} [${Element.LEVEL}] ${Element.CALLER} - ${Element.MESSAGE}
        """.trimIndent()){}
        this.level = LogLevel.DEBUG
    }).getLogger()
    
logger.info("something")

logger.error("something error")
```

これは以下のように出力されます。（さきほど画像にしたのは色付きなのを見てほしくて......）  

```text: output
2025-06-23T14:28:47.709871583 [INFO] c.m.i.c.CLKMainKt#main:45 - something
2025-06-23T14:28:47.78663144 [ERROR] c.m.i.c.CLKMainKt#main:46 - something error
```

### 構造化ログの出力
また、構造化されたログも出力できます。

```kotlin: LoggerSample.kt
val logger = ColotokLoggerFactory()
    .addProvider(ConsoleProvider{
        this.formatter = SimpleStructureFormatter
        this.level = LogLevel.DEBUG
    }).getLogger()
    
logger.info("something")

logger.error(Log(
    name = "event0001",
    logDetail = LogDetail(
        scope = "login",
        message = "attack!!!"
    )))

logger.debug(Credential(
    username = "user0001",
    password = "kggDYDDnVH9bSHLp4SXxqfVYmmz/ObedPqCkFzGJvVY=",
    raw_password = "password"
))
```

これは以下のように出力されます。  
`password`が伏せ字になっていることにも注目です。

```text: output
{"message":"something","level":"INFO","date":"2025-06-23"}
{"message":{"name":"event0001","logDetail":{"scope":"login","message":"attack!!!"}},"level":"ERROR","date":"2025-06-23"}
{"message":{"username":"user0001","password":"********************************","raw_password":"password"},"level":"DEBUG","date":"2025-06-23"}
```

### MDCの利用
MDCを利用するには、 `Element.CUSTOM`を使用してフォーマッタを構築します。

```kotlin: LoggerSample.kt
val logger = ColotokLoggerFactory()
    .addProvider(ConsoleProvider{
        this.formatter = object: TextFormatter("""
        user=${Element.CUSTOM("userId")} - ${Element.MESSAGE}
    """.trimIndent()){}
    })
    .getLogger()
    
MDC.put("userId", "user1234")

logger.info("accessed")
```

このようにすると、以下のように出力されます。

```text: output
user=user1234 - accessed
```

## さいごに
なんか記事が長くなりそうなのでこのへんでやめておきます。  
それにしてもログって何をどこまで、どのレベルで出すか大変だよね。

https://github.com/milkcocoa0902/colotok