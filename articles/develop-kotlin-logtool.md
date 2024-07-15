---
title: "Kotlinでロギング用ツールを実装した"
emoji: "☃"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
    - Kotlin
    - 個人開発
    - ライブラリ
published: true
---

## この記事はなに？
Kotlinでロギング用のライブラリを実装し始めたので、その紹介をします。

https://github.com/koron0902/CLK

## 機能
ひとまず、以下の機能を備えています。

- ログレベルごとに色付きの出力が可能
    - ログレベルは `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR` の順に5レベル
- ログの書式を指定できる
    - デフォルトは `Plain`, `Simple`, `Detail`（後述）
- ログの出力先を複数指定できる
    - デフォルトはコンソールとファイル（両方指定可能、複数ファイルもいける）
- ログローテーションができる
    - ひとまずファイルサイズベースのローテーション

## まずは使い方
### 設定をしない場合

``` kotlin
val logger = LoggerFactory()
    .addProvider(ConsoleProvider())
    .addProvider(FileProvider("./test.log"))
    .getLogger()

logger.trace("TRACE LEVEL LOG")
logger.debug("DEBUG LEVEL LOG")
logger.info("INFO LEVEL LOG")
logger.warn("WARN LEVEL LOG")
logger.error("ERROR LEVEL LOG")
```

ざっくりこんな感じになります。  
ちなみにデフォルトのログレベルは `DEBUG`なので`TRACE`レベルのログは出てきません。  
![](/images/develop-kotlin-logtool/clk_1.png)

気になるキーワードがいくつかありますね

#### ConsoleProvider
名前の通り、コンソール出力をするためのものです

#### FileProvider
これも見たままですね、ファイルに対して出力をしてくれます

### 設定をする場合

```
val fileProvider: FileProvider
val logger = LoggerFactory()
    .addProvider(ConsoleProvider{
        logLevel = LogLevel.INFO
    })
    .addProvider(FileProvider("./test.log"){
        logLevel = LogLevel.TRACE
        enableBuffer = true
        bufferSize = 2048
        rotation = SizeBaseRotation(size = 4096)
    }.apply {
        fileProvider = this
    })
    .getLogger()

logger.trace("TRACE LEVEL LOG")
logger.debug("DEBUG LEVEL LOG")
logger.info("INFO LEVEL LOG")
logger.warn("WARN LEVEL LOG")
logger.error("ERROR LEVEL LOG")

fileProvider.flush()
```

例えばこのように設定します。なんか設定が増えましたね。。。。

``` kotlin
ConsoleProvider{
    logLevel = LogLevel.INFO
}
```


``` kotlin
FileProvider("./test.log"){
    logLevel = LogLevel.TRACE
    enableBuffer = true
    bufferSize = 2048
    rotation = SizeBaseRotation(size = 4096)
}
```

#### logLevel
プロバイダ単位のログレベルの設定をします。
コンソールは`INFO`レベルに設定したので、`TRACE`と`DEBUG`は無視されます。
ファイルの方は `TRACE` になっているので、すべてのログが吐き出されることになります。 


#### enableBufferとbufferSize
ファイル出力のバッファを有効にして、そのサイズを指定しています。今回は、2048にしているので、 2KiB単位でファイルに出力することになります。ようするにディスクI/Oを減らすための機能です。  

#### rotation
これはログローテーションですね。ひとまずサイズベースのローテーションを実装しています。ファイル書き込み後、ここで指定したサイズを上回っていた場合にファイルをローテーとします。

と、ここまで読むと、バッファを有効にしたとき、それを上回らない限りログは出力されないのかと疑問に思うかと。  
正解です。なので、そうならないように `flush()`を呼び出してあげることで、バッファに溜まっているものをファイルに書き出してあげることができます。



## カスタマイズ
### ログ出力の色を変える
ログ出力の色は、ANSIカラーコードを使って色を変えています。具体的にそれがなんなのかの説明はここでは省きますが、以下のようにして色を変えることができます。
```
ConsoleProvider{
    traceLevelColor = AnsiColor.BLACK
}
```
ここでは、 `TRACE`レベルの色を黒に変えています。デフォルトは白です

### ログ出力のフォーマットを変える
現在、ログのフォーマットの種類をビルトインで何種類か作っています。

#### PlainFormatter
なにも付加情報を与えず、単純に書き出します。
```
ERROR LEVEL LOG
```

#### SimpleFormatter
どこがシンプルなのかはわかりませんが、
```
2023/10/09 16:37:58 [ERROR] - ERROR LEVEL LOG
```
のような出力になります。

#### DetailFormatter
`SimpleFormatter`よりちょっとだけ詳しくなります。
```
2023/10/09 16:39:27 (main)[ERROR] - ERROR LEVEL LOG
```

スレッド名が付きました。だけです。

#### カスタムする
こんな感じのフォーマッターを実装して、プロバイダに食わせます。
```
object CustomFormatter : Formatter(
    """
        ${Element.YEAR}/${Element.MONTH}/${Element.DAY} 
        ${Element.HOUR}:${Element.MINUTE}:${Element.SECOND} 
        [${Element.LEVEL}] - ${Element.MESSAGE}
    """.trimIndent()
        .replace("\n", "")
)

ConsoleProvider{
    formatter = CustomFormatter
}
```

ある程度パット見でできるようになっていますが、中の実装を見るとがっかりすると思います。
:::: details がっかりする中の実装
単に`replace`でどんどんチェーンしているだけです。
```
abstract class Formatter(private val fmt: String) {
    fun format(msg: String, level: LogLevel): String {
        val dt = LocalDateTime.now()

        return fmt.replace(Element.YEAR.toString(), String.format("%4d", dt.year))
            .replace(Element.MONTH.toString(), String.format("%02d", (dt.monthValue + 1)))
            .replace(Element.DAY.toString(), String.format("%02d", dt.dayOfMonth))
            .replace(Element.HOUR.toString(), String.format("%02d", dt.hour))
            .replace(Element.MINUTE.toString(), String.format("%02d", dt.minute))
            .replace(Element.SECOND.toString(), String.format("%02d", dt.second))
            .replace(Element.MESSAGE.toString(), String.format("%s", msg))
            .replace(Element.LEVEL.toString(), String.format("%s", level))
            .replace(Element.THREAD.toString(), String.format("%s", Thread.currentThread().name))
    }
}
```
::::

### ログの出力先をカスタムする
このログツールのキモみたいな箇所です。  
デフォルトで用意しているのはコンソール出力とファイル出力ですが、それ以外の出力も簡単に作れます。
ログレベルとか、フォーマットとかなにも考えなければ
```
class NetworkProvider: Provider{
    override fun write(name: String, str: String, level: LogLevel) {
        // ネットワーク越しにログを投げる
        api.post(str)
    }
}
```
みたいなクラスを作って食わせたら投げられます。 `Config`を生やしたい場合はもう少しちゃんとハンドルしてあげないといけませんが。

## 起こるであろう問題
`FileProvider`がスレッドセーフになっていないので、おそらく衝突します。なんとかしないとね。

## 最後に
いまさら必要か？