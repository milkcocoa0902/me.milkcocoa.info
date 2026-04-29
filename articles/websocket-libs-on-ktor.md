---
title: "Ktorを利用したWebSocketライブラリ"
description: 'KtorのWebSocketを型安全かつ便利に利用するために開発している、TinderのScarletにインスパイアされたライブラリ「Crimson」の実装例を紹介します。'
date: '2025-04-30T21:55:00.000+09:00'
emoji: "🧵"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
  - Ktor
  - WebSocket
  - Kotlin
published: true
---

こんにちは、ここあです。  
いきなり本題ですが、最近はKtorのWebSocketを（個人的に）便利に使えるようなライブラリの開発を勧めています。  

具体的には、型安全にWebSocketを使いたいというモチベーションです。  

ということで作っているのが、以下のCrimsonです。  

https://github.com/milkcocoa0902/Crimson

ちなみにCrimsonという名前は、Tinderの開発しているWebSocketライブラリにScarletというものがあり、そこからとっています。  

## Client側
クライアント側はこんな感じです。  


```kotlin : ClientMain.kt 
fun main(){
    val crimsonClient = CrimsonClient{
        crimsonHandler = object: CrimsonHandler<ChatMessage, ChatResponse> {
            override suspend fun onConnect(crimson: CrimsonClientCore<ChatMessage, ChatResponse>, flow: SharedFlow<ChatResponse>) {
                crimson.send(ChatMessage("hello"))
            }

            override suspend fun onError(e: Throwable) {
                println(e)
            }

            override suspend fun onClosed(code: Short, reason: String) {
                println("$code $reason")
            }
        }

        webSocketEndpointProvider = object: WebSocketEndpointProvider {
            override suspend fun build(): ConnectionInfo {
                return ConnectionInfo("ws://127.0.0.1:54321/chat")
            }
        }

        retryPolicy = RetryPolicy.SimpleDelay(30.seconds)
        dispatcher = CrimsonCoroutineDispatchers.io
        // 今回はバイナリでやり取り
        contentConverter = ContentConverter.Binary.Protobuf(
            protobuf = ProtoBuf.Default,
            upstreamSerializer = ChatMessage.serializer(),
            downstreamSerializer = ChatResponse.serializer()
        )
    }

    runBlocking {
        crimsonClient.execute(CrimsonCommand.Connect)
    }

    CoroutineScope(Dispatchers.Default).launch {
        crimsonClient.connectionStatus.collect { connectionStatus ->
            println(connectionStatus) 
        }
    }
    CoroutineScope(Dispatchers.Default).launch {
        crimsonClient.incomingMessage.collect { incoming ->
            println(incoming) 
        }
    }

    Thread.sleep(60.minutes.inWholeMilliseconds)
}
```


## Server側
サーバ側はこんな感じ。  
今回は受信したらそれをブロードキャストするようにしています。  

```kotlin : ServerMain.kt
fun main(){
    embeddedServer(CIO, port = 54321){
        install(WebSockets) {
            pingPeriod = 15.seconds
            timeout = 15.seconds
        }
    
        install(Crimson){
            crimsonConfig("chat"){
                contentConverter = ContentConverter.Binary.Protobuf(
                    protobuf = ProtoBuf.Default,
                    upstreamSerializer = ChatMessage.serializer(),
                    downstreamSerializer = ChatResponse.serializer()
                )
            }
        }
    
        routing {
            val crimsonSessionCluster = CrimsonLocalSessionCluster<ChatMessage, ChatResponse>()
            launch {
                crimsonSessionCluster.crimsonServerSessionFlow.collect {
                    println(it)
                }
            }
            
            crimson<ChatMessage, ChatResponse>(
                path = "/chat",
                crimsonSessionCluster = crimsonSessionCluster,
                config = "chat"
            ){ sessionRegistry ->
                incomingMessageFlow.collect {
                    sessionRegistry.all.broadcast(ChatResponse(it.text))
                }
            }
        }
    }.start(wait = true)
}
```

## さいごに
あとから知ったんですが、Ktorにも `fun<T> sendSerializable(data: T)` みたいなやつとか、あるみたいですね。  
とはいえ、それらより使いやすく開発できていると思っています。しらんけど。