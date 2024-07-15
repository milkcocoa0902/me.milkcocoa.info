---
title: "Node.jsとDenoのPING/PONGの差分に関して"
description: ''
date: '2023-11-13T23:39:00.000+09:00'
emoji: "👻"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
    - Deno
    - Nodejs
    - WebSocket
published: false
---

## この記事はなに？？？
Node.jsをWebSocketサーバで動かしたときとDenoをWebSocketサーバとして動かしたときの挙動の違いを比較してみたよ。  
デフォルトだとDenoのWebSocketは死んでいそうなクライアントを積極的に切りに行くよ

## サーバの実装
今回の検証では、それぞれ次のようなコードでWebSocketサーバを用意しました。

### Node.js版の実装

`ws`モジュールを使ったよくある実装ですね。
今回は検証のための簡易的なものとして、 `http`モジュールの上に重ねて立てるようなことはしていません。

``` TypeScript : server.ts
const server = require("ws").Server;
const s = new server({ port: 5001 });

s.on("connection", ws => {
    console.log(`${Date().toString()}: client connected`)
    ws.on("message", message => {
        console.log(`${Date().toString()}: receive data: ${message}`)
    });
    ws.on('close', (code, reason) => {
        console.log(`${Date().toString()}: client disconnected`)
    })
});
```

### Deno版の実装
対して、Denoでの実装です。こちらは標準モジュールだけで実装することができます。バージョンは少し古いですが気にしないでください。

``` TypeScript : server.ts
import { serve } from "https://deno.land/std@0.156.0/http/server.ts";


const handler = (req: Request) => {
  const { response, socket } = Deno.upgradeWebSocket(req);
  socket.onopen = () => {
    console.log(`${Date().toString()}: client connected`)
  }

  socket.onclose = () => {
    console.log(`${Date().toString()}: client disconnected`)
  }

  socket.onmessage = (evt: MessageEvent<any>) =>{
    console.log(`${Date().toString()}: receive data: ${evt.data}`)
  }

  socket.onerror = (evt: Event | ErrorEvent) => {
    console.log(`${Date().toString()}: error:`)
  }

  return response;
}

const s = serve(handler, { port: 5001 })

```

## クライアントの検証
クライアントはAndroidとPythonでそれぞれ確認してみましょう。

### Android版の実装

めんどうなので、画面も何も作らず、Activityにベタッとクライアントを貼って終わりです。今回の目的は挙動が確かめたいだけなので。  
ライブラリは `org.java-websocket:Java-WebSocket:1.5.4`を使っています。 `OkHttp3`を使っても良かったのですが、 PING/PONGのフレームが可視化できなかったので。

```Kotlin : MainActivity.kt
class MainActivity: AppCompatActivity() {
 override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)

  val sock = object: WebSocketClient(URI.create("ws://10.0.2.2:5001")){
   override fun onOpen(handshakedata: ServerHandshake?) {
    println("onOpen")
   }

   override fun onMessage(message: String?) {
    println("onMessage")
   }

   override fun onClose(code: Int, reason: String?, remote: Boolean) {
    println("onClose")
   }

   override fun onError(ex: Exception?) {
    println("onError")
   }

   override fun onWebsocketPong(conn: WebSocket?, f: Framedata?) {
    super.onWebsocketPong(conn, f)
    println("onWebsocketPong")
   }

   override fun onWebsocketPing(conn: WebSocket?, f: Framedata?) {
    super.onWebsocketPing(conn, f)
    println("onWebsocketPing")
   }
  }

  CoroutineScope(Dispatchers.Main).launch {
   sock.connect()
  }
 }
}
```

### Python版の実装
こちらも簡単に、 `websocket-client`モジュールで接続して放置です。  
今回はあえてWebSocketAppに触れません。 `recv()`をしない点にも仕掛けがあります。

``` Python : client.py
import os
import sys
sys.path.append(os.path.join(__file__, 'site-packages'))

import websocket

ws = websocket.WebSocket()
ws.connect('ws://127.0.0.1:5001')
```


## 結果の確認

### Android版
ひとまずAndroid版から確認していきます


``` : Deno版ログ
2023-09-15 22:24:05.856 20415-20435 System.out              com...ocoa.info.websocket_ping_pong  I  onOpen
2023-09-15 22:25:05.859 20415-20435 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPing
2023-09-15 22:25:05.859 20415-20435 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPong
2023-09-15 22:26:05.858 20415-20435 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPong
2023-09-15 22:26:05.903 20415-20435 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPing
2023-09-15 22:27:05.858 20415-20435 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPong
2023-09-15 22:27:05.905 20415-20435 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPing
2023-09-15 22:28:05.858 20415-20435 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPong
2023-09-15 22:28:05.907 20415-20435 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPing
2023-09-15 22:29:05.858 20415-20435 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPong
2023-09-15 22:29:05.908 20415-20435 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPing
2023-09-15 22:30:05.858 20415-20435 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPong
```


``` : Node.js版ログ
2023-09-15 22:43:46.461 20529-20550 System.out              com...ocoa.info.websocket_ping_pong  I  onOpen
2023-09-15 22:44:46.465 20529-20550 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPong
2023-09-15 22:45:46.463 20529-20550 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPong
2023-09-15 22:46:46.463 20529-20550 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPong
2023-09-15 22:47:46.463 20529-20550 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPong
2023-09-15 22:48:46.463 20529-20550 System.out              com...ocoa.info.websocket_ping_pong  I  onWebsocketPong
```


さて、両者の明らかな違いは、Deno版ではPINGが降ってきてPONGで応答しているのに対して、Node.js版ではひたすらPONGが降ってきて終わりです。  
PONGに対してもう一端が応答する必要はありません。RFCで定められているのは、PINGに対して素早く応答せよ、という点です。

### Python版
結果を載せたいところですが、載せようにも載せるものがありません。検証の仕方がとても下手くそですね。  
サーバ側のログを見せればいいのか

ということで

``` : Deno版ログ（サーバ側）
Sat Sep 16 2023 00:14:02 GMT+0900 (Japan Standard Time): client connected
Sat Sep 16 2023 00:16:02 GMT+0900 (Japan Standard Time): error:
Sat Sep 16 2023 00:16:02 GMT+0900 (Japan Standard Time): client disconnected
```

``` : Node.js版ログ（サーバ側）
Sat Sep 16 2023 00:20:52 GMT+0900 (Japan Standard Time): client connected
```

Node.js版は待てど暮らせど切断されないので単品のログで勘弁してください。

## ということで
Android版の結果を見ると、Node.js版はPONGのみを送ってきて、Deno版はPINGを送ってきていたのでPONGを返送していました。その結果、接続は維持されています。  
一方でPython版では、Node.jsは接続は途切れなかったのに対して、Deno版は2分で接続が途切れてしまいました。  
つまり、Denoの実装は積極的に接続相手の生存確認をしており、PINGに応答がなければ切断してしまっています。これは、WebSocketの挙動としては正しいです。  
Node.jsはTCPコネクション維持のためにPONGを送信していることが読み取れます。これに関しても特に誤っているわけではなく、PINGなしにPONGを送ることは許容されています。


さて、今回はそれぞれのデフォルトの挙動で比較したわけですが、 `Deno.upgradeWebSocket()`では、[Deno.UpgradeWebSocketOptions](https://deno.land/api@v1.36.4?s=Deno.UpgradeWebSocketOptions)というものを渡すことができ、この中で `idleTimeout`を指定することで、接続を切ってしまう時間を制御することができます。0にするとNode.jsのようにひたすらPONGするマシンになります。へんなの

ちなみに、大抵のクライアントはPINGを受けたら勝手にPONGを返してくれるはずなので、普段はこの実装差を意識することはないはずです。負荷テストとかを仕様としたときに気にするくらいでしょうか？  
あと、Denoにおいて、oakとか使ってるとタイムアウト値をいじれないのでご注意を。

## 最後に
クライアントが意識しないことでも、挙動の差分は把握しておきましょう。  
以上、なぐり書きでしたが。