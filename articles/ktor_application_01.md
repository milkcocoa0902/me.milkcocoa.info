---
title: "Kotlinでつくるサーバサイドアプリケーション【01】"
emoji: "🦀"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
    - Kotlin
    - Ktor
    - サーバーサイド
published: true
---

唐突ですが、サーバサイドアプリを作るとき、どのような選択肢があるでしょうか？  
　Pythonを普段使っている人であればDjangoかFlask、  
　C#を使っている人はASP .NET、  
　あるいは、Node.jsやSpring Boot
など、現在は様々な言語でサーバサイドのアプリケーションを構築することができますね。

そんな中、Kotlin製のWebアプリケーションフレームワークであるKtorを紹介したいと思います。

# Ktorとは

Kotlinの開発元であるJetBain社の開発したWebアプリケーションフレームワークであり、次のような特徴があります。

- 非常に軽量である
- 拡張性に富んでいる
- Coroutinesをベースにしており、非同期処理が得意

と言ったところでしょうか。

::: message
勘違いしてはいけないのは、Ktorはマイクロフレームワークである、という点です。
ですので、単純にSpringBootなどのフルスタックフレームワークと比較することはできません。
:::



# Ktorの導入

本題に入る前に、プロジェクトを作りましょう。  
今回は、InteliJ ideaを使用してプロジェクトを新規に作成しました。
![](/images/ktor_application_01/1_create_project.png)

作成した直後の `build.gradle.kts` はおおよそ以下の形式になっていると思います。



``` Kotlin : build.gradle.kts
plugins {
    kotlin("jvm") version "1.8.0"
    application
}

group = "org.example"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
}

kotlin {
    jvmToolchain(11)
}

application {
    mainClass.set("MainKt")
}

```

## 依存関係の解決

Ktorを利用するにあたって、必要なものをインストールしていきます。



```　Kotlin : build.gradle.kts
val ktor_version = "2.2.3"
implementation("io.ktor:ktor-server-core:$ktor_version")
implementation("io.ktor:ktor-server-netty:$ktor_version")
```

## Hello World

Ktorをインストールできたら、いよいよ実装していきましょう。  
簡単な例として、ひとまず以下のようにして実行してみます。



``` Kotlin : /src/main/main.kt
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.response.*
import io.ktor.server.routing.*


fun main(args: Array<String>) {
    val server = embeddedServer(
        factory = Netty, 
        port = 8888) {
        routing {
            get("/") {
                call.respondText("Hello World!", ContentType.Text.Plain)
            }
        }
    }
    server.start(wait = true)
}
```

`./gradlew run`で実行して、ブラウザで [http://localhost:8888/](http://localhost:8888/) にアクセスしてみると、下の図のように表示されたでしょうか？  
もうおわかりですね。先程のコードは、8888ポートで待ち受けて、ルートへのアクセスに対して Hello Worldという文字列をレスポンスするものです。


![](/images/ktor_application_01/2_hello_world.png)


# 構成をモジュール化する
## アプリケーションをモジュール化する

ここでは、先程作成したアプリケーションをモジュール化していきます。
今回の例はとても簡単なアプリケーションなのでモジュール化のメリットを感じにくいかもしれませんが、プロジェクトが巨大になってきたときに機能ごとにモジュール分離することで、プロジェクト全体の見通しが良くなったり、あるスコープ（ここではmain関数）を見たときに肥大化することを抑えられるなど、保守面で有利に働いてきます。


``` Kotlin : /src/main/main.kt

fun main(args: Array<String>) {
    embeddedServer(
        factory = Netty,
        port = 8888,
        module = Application::module).start()
}

fun Application.module(){
    install(Routing){
        get("/") {
            call.respondText("Hello World!", ContentType.Text.Plain)
        }
    }
}
```

## 設定を外部に出す

アプリケーションの実行に関わる情報は、外部の設定ファイルに書き出すことができます。
下記の例では、アプリケーションの待受ポートと使用するモジュールを設定しています。
これらは予約済みの設定項目ですが、もちろん独自の設定項目を記述してアプリケーション内で利用することも可能になっています。

``` conf : src/main/resources/application.conf

ktor {
    deployment {
        port = 8888
    }
    application {
        modules = [ MainKt.module ]
    }
}
```

またgradleファイルで、使用するエンジンを教えてあげます


```　Kotlin : build.gradle.kts
application {
    mainClass.set("io.ktor.server.netty.EngineMain")
}
```

ここまで記述すると、これまで利用していたmain関数は不要になるので削除してしまいましょう

## ルーティングをモジュール化する

いままで、APIのルート設定はmain関数、あるいはモジュールの設定の中にベタ書きしていました。
が、これらもやはり外に出してしまうことができます。こうすることで、ルートを系統ごとに管理することができるようになり見通しが良くなります。

このあたりは、Kotlinの拡張関数の恩恵が使えますね。

``` Kotlin : /src/main/main.kt
fun Application.module() {
    install(Routing) {
        root()
    }
}

fun Routing.root(){
    get("/") {
        call.respondText("Hello World!", ContentType.Text.Html)
    }
}
```

# 様々なリクエストを受け取ってみる
## クエリストリングを受け取る

クエリストリングを受け取るには次のように記述します

``` Kotlin : /src/main/main.kt
    get("/"){
        val param1 = call.request.queryParameters.get("param1")
        val param2 = call.request.queryParameters.get("param2")

        call.respondText("param1 = $param1, param2 = $param2 ")
    }
```

## パスパラメータを利用する
パスパラメータは以下の形式で取得することができます


``` Kotlin : /src/main/main.kt
    get("/{path}"){
        val pathParam = call.parameters.get("path")
        call.respondText("pathParameter = $pathParam")
    }
```


## リクエストボディを受け取る
また、リクエストボディを受け取るには以下のように記述します。

``` Kotlin : /src/main/main.kt
    post("/"){
        val parameters = call.receiveParameters()
        val param1 = parameters.get("param1")
    }
```

# まとめ

今回は、Ktorでアプリケーションを作成し、様々なリクエスト受け取ってみました。

次回は、JSONの受け渡し、あるいは型安全なルーティングあたりを解説していきます。

# おわりに
Ktorを使ったAndroidアプリを出しているので興味があればぜひ。

https://zenn.dev/milkcocoa0902/articles/publish-pet-sns-app