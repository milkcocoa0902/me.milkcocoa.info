---
title: "Kotlinでつくるサーバサイドアプリケーション【02】"
description: ''
date: '2023-08-15T14:33:00.000+09:00'
emoji: "🐈"
type: "tech" # tech: 技術記事 / idea: アイデア
topics:
  - Kotlin
  - Ktor
  - サーバーサイド
published: true
---

## この記事はなに？

以下の記事の続きです  
https://zenn.dev/milkcocoa0902/articles/ktor_application_01

## 今回の内容

前回、Kotlin製のフレームワークであるKtorの導入を行いました。今回は、そこから少しだけ発展して、

- 型安全なルート定義
- JSONのやり取り

あたりに触れていきたいと思います。

## 型安全にルートを定義する

### 依存関係の解決

Ktor ver.2では、`Resources`モジュールを使って型安全なルートを定義します。ちなみにver.1時代では `Location`モジュールを使っていました

``` Kotlin : build.gradle.kts
// 追加
implementation("io.ktor:ktor-server-resources:$ktor_version")

```

### プラグインをインストールする

依存関係を追加したら、忘れずにプラグインをインストールしましょう

``` Kotlin : /src/main/main.kt

fun Application.module{
    // 追加
    install(Resources)
}

```

### エンドポイントを定義する

ひとまず、こんな感じでしょうか

``` Kotlin: /src/main/TypeSafeRoutes.kt
import io.ktor.resources.Resource
import io.ktor.server.application.*
import io.ktor.server.resources.get
import io.ktor.server.response.*
import io.ktor.server.routing.*

@Resource("/test")
class TypeSafeRoutes{

    @Resource("{id}")
    class Details(val parent: TypeSafeRoutes = TypeSafeRoutes(), val id: String)
}

fun Route.typesafeRoutes(){
    get<TypeSafeRoutes>{

    }

    get<TypeSafeRoutes.Details> {
        call.respondText("String ID: ${it.text}")
    }
}

```

ルートの登録も忘れてはいけません

``` Kotlin : /src/main/main.kt
fun Application.module{
    install(Routing){
        // 追加
        typesafeRoutes()
    }
}

```

### 呼び出してみる

`./gradlew run`で実行したあと、curlを使ってAPIを呼び出してみます。

``` cmd
curl -vvv http://localhost:8888/test/something_id
*   Trying 127.0.0.1:8888...
* Connected to localhost (127.0.0.1) port 8888 (#0)
> GET /test/something_id HTTP/1.1
> Host: localhost:8888
> User-Agent: curl/7.81.0
> Accept: */*
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Content-Length: 23
< Content-Type: text/plain; charset=UTF-8
< 
* Connection #0 to host localhost left intact
String ID: something_id                                      
```

しっかりとIDが受け取れていますね

では、 `Details`の`id`の型を `String`から`Int`に変えてみるとどうでしょう？

``` Kotlin : /src/main/main.kt
    @Resource("{id}")
    class Details(val parent: TypeSafeRoutes = TypeSafeRoutes(), val id: Int)

    ~~~~~~~

    get<TypeSafeRoutes.Details> {
        call.respondText("Int ID: ${it.id}")
    }
```

このAPIを実行してcurlを叩いてみましょう
``` cmd

$ curl -vvv http://localhost:8888/test/1234567     
*   Trying 127.0.0.1:8888...
* Connected to localhost (127.0.0.1) port 8888 (#0)
> GET /test/1234567 HTTP/1.1
> Host: localhost:8888
> User-Agent: curl/7.81.0
> Accept: */*
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Content-Length: 15
< Content-Type: text/plain; charset=UTF-8
< 
* Connection #0 to host localhost left intact
Int ID: 1234567


$ curl -vvv http://localhost:8888/test/abcdefg
*   Trying 127.0.0.1:8888...
* Connected to localhost (127.0.0.1) port 8888 (#0)
> GET /test/abcdefg HTTP/1.1
> Host: localhost:8888
> User-Agent: curl/7.81.0
> Accept: */*
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 400 Bad Request
< Content-Length: 0
< 
* Connection #0 to host localhost left intact

```

文字列を渡したらしっかりとエラーになってくれました。

::: message alert
この調子で、StringのIDとIntのIDを同一の階層に同居させたいところですが、その場合は意図したとおりにルーティングすることができません。

順序にも意味が出てきて、先に文字列IDのものを定義したとき、すべてのリクエストはそちらで捌かれます。  
一方で、数値IDのものを先に定義したとき、文字列を渡すとエラーになります。
:::


## JSONを用いてデータの受け渡しをする

Webアプリケーションを扱うなら、やはりJSONが使いたいですよね？僕は使いたいです。  
てなわけで、JSONを使えるようにしましょう

### 依存関係の解決

例のごとく、`build.gradle.kts`に依存関係を追加して、モジュール側でプラグインを有効化します。

なお、jsonのシリアライズ・デシリアライズには `jackson`や `kotlin-serialization`などを使用することができます。  
個人的なプロダクトでは`jackson`を用いているのですが、ここでは`kotlin-serialization`を使うことにします。

::: message
最初、`kotlin-serialization`を使えることを知らずに`jackson`を使っており、レスポンスの型をGenericsでわちゃわちゃしたあと`kotlin-serialization`へ移行しようとしたらうまくシリアライザを生成してくれなかったので、詳しい方がいたらぜひ
:::


``` Kotlin : build.gradle.kts
plugins {
    // 追加
    id("org.jetbrains.kotlin.plugin.serialization") version "1.8.0"
}


dependenties {
    // 追加
    implementation("io.ktor:ktor-server-content-negotiation:$ktor_version")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktor_version")
}
```

``` Kotlin : /src/main/main.kt
    // 追加
    install(ContentNegotiation){
        json()
    }
```

### JSONをレスポンスする

JSONを用いてデータをやり取りするには、それに対応したクラスを作成する必要があります。こういうのをPOJOって言うんですかね？そのへんの言葉はよくわかりませんので。



#### レスポンス用モデル

というわけで、まずはレスポンスするためのモデルを作成してみます。
今回は適当に、以下のような感じでしょうか

``` Kotlin
@Serializable
data class TestResponseModel(
    val param1: String,
    val param2: Int
)
```

#### レスポンスする

モデルさえ定義してしまえば、レスポンス自体は簡単で、 `ApplicationCall.respond()` にモデルのインスタンスを渡してあげるだけです。

``` Kotlin
call.respond(
    TestResponseModel(
        param1 = "param1",
        param2 = 1
))
```

### リクエストを受け取る
#### モデルを定義する


レスポンスするときと同様に、受け取ったボディをデシリアライズするためのクラスを作成します。今回は下記のようなモデルを対象にしてみます。


``` Kotlin
@Serializable
data class TestRequestModel(
    val param1: String,
    val param2: Int?
)
```


#### リクエストボディの読み取り

前回、リクエストボディを受け取るには以下のようにすると説明しました。

``` Kotlin
val parameters = call.receiveParameters()
val param1 = parameters.get("param1")
```

この場合、キーバリュー形式のボディしか読み取ることができません。
今回、作成したモデルに対応したデータに埋め込みたいので、以下のように変更します。

``` Kotlin
val parameters = call.receive<TestResponseModel>()
```


### 呼び出してみる

というわけで、ここまででJSONのやり取りができるようになったので、実際に呼び出してみます。

なお、今回は下記のようなルートを設定しました。

``` Kotlin
post("/"){
    val req = call.receive<TestRequestModel>()

    call.respond(
        TestResponseModel(
            param1 = "param1 = ${req.param1}",
            param2 = req.param2 ?: -1
    ))
}
```

これに対していろいろと投げてみます。

まずは普通に投げてみます。

``` cmd
url -vvv -X POST -H "Content-Type:application/json"  http://localhost:8888/ -d '{"param1": "string parameter", "param2": 1111}'
Note: Unnecessary use of -X or --request, POST is already inferred.
*   Trying 127.0.0.1:8888...
* Connected to localhost (127.0.0.1) port 8888 (#0)
> POST / HTTP/1.1
> Host: localhost:8888
> User-Agent: curl/7.81.0
> Accept: */*
> Content-Type:application/json
> Content-Length: 46
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Content-Length: 52
< Content-Type: application/json
< 
* Connection #0 to host localhost left intact
{"param1":"param1 = string parameter","param2":1111}

```

次に、リクエストの `param2`を欠損させてみます。Optionalになっているので欠けていても良さそうですが、どうでしょう。。。

```
curl -vvv -X POST -H "Content-Type:application/json"  http://localhost:8888/ -d '{"param1": "string parameter"}'
Note: Unnecessary use of -X or --request, POST is already inferred.
*   Trying 127.0.0.1:8888...
* Connected to localhost (127.0.0.1) port 8888 (#0)
> POST / HTTP/1.1
> Host: localhost:8888
> User-Agent: curl/7.81.0
> Accept: */*
> Content-Type:application/json
> Content-Length: 30
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 400 Bad Request
< Content-Length: 0
< 
* Connection #0 to host localhost left intact
```

::: message alert
kotlin serializationの挙動を知っている人からすれば自明ですが、この場合はキー欠損として例外が送出されます。
そのため、キー欠損を許容したい場合には、Optionalにした上でデフォルト値としてnullを設定しておくと良いでしょう
:::

他にも、型が合わない場合や、余計なフィールドが混じっているパターンなど色々考えられますが、 ~~めんどくさくなってきた~~ 挙げていくとキリがないのでここでは触れないことにします。試してみてください。

## まとめ

最後のほうがだいぶ駆け足になってしまいましたが、

- `Resources` プラグインを使って、型安全なルートを作成できる
- `ContentNegotiation` と、適宜シリアライザを導入することで、JSONを取り扱うことができる

という内容でした。冒頭に書いたとおりでしたね。

## 最後に
Ktorを使ったAndroidアプリを出しているので興味があればぜひ。

https://zenn.dev/milkcocoa0902/articles/publish-pet-sns-app
