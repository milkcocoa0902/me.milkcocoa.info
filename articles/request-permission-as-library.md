---
title: "権限確認のリクエストがめんどくさくなったのでライブラリ化した"
description: ''
date: '2023-12-10T23:39:00.000+09:00'
emoji: "🤖"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
    - Android
    - ライブラリ公開
published: true
---

## この記事はなに？
Androidの開発をしていて、カメラや位置情報を使うときに権限の要求を同期的（＝許可なり拒否なりがその場でわかりたい）場合ってあると思います。  
そんなときにいつも実装しているコードがあるのですが、毎回のように書くのが面倒だったので最終的にライブラリ化しました。

## 使用感

### セットアップ
jitpackで配信しているので、まずはmavenリポジトリを追加します。

``` kts : settings.gradle.kts
repositories {
    google()
    mavenCentral()
    // 追加
    maven( url =  "https://jitpack.io" )
}
```

続いて、ライブラリを取得します。

``` kts : build.gradle.kts(:app)
dependencied{
    ....
    // 追加
    implementation("com.github.milkcocoa0902:PermissionUtility:0.1.0")
}
```

### 呼び出してみる
例えばカメラの権限がほしいとき、以下のように使用します。  
今回は、 `onStart()`で問答無用に呼んでいるので、かなりしつこいですね。やめましょう。

``` Kotlin : MainActivity.kt
val requestCameraPermission: RequestPermissionLauncher = 
    RequestPermissionLauncher(
        activity = this,
        permission = Manifest.permission.CAMERA
    )

override fun onStart(){
    CoroutineScope(Dispatchers.Main).launch {
        runCatching {
            requestCameraPermission.launch().let { result ->
                when(result){
                    PermissionResult.PERMISSION_GRANTED ->{
                        // 許可された / されている
                    }
                    PermissionResult.PERMISSION_DENIED ->{
                        // 拒否された
                    }
                    PermissionResult.PERMISSION_ABSOLUTELY_DENIED ->{
                        // 「今後表示しない」で拒否されている
                    }
                }
            }
        }.getOrNull()
    }
}
```

::: message 
多重に `launch()`しようとしたときに例外を送出するようにしているため、 `runCatching()`で捕捉しています。
:::

## 実装
ざっくりと要点だけ。
まずは、今回作ったライブラリのコンストラクタで、 `registerForActivityResult()` APIを使用して処理を登録しておきます。  
このとき、 `shouldShowRequestPermissionRationale()`を使用することで、「今後表示しない」を判定することができます。

実はこの `shouldShowRequestPermissionRationale()`ですが、副次的に「今後表示しない」状態かどうかを確認できるものの、本来の目的は、「権限ダイアログを出す前に説明画面を出すべきかどうか」を判定するためのものとなっています。  
そのため、その結果は

- 1回も権限を聞いていない ... false
- 1回拒否されていて、「今後表示しない」 **でない** ならばtrue
- 1回拒否されていて、「今後表示しない」 **である** ならばfalse

となります。  
つまりGoogle的には、「以前拒否されているのに許可を取りに行くなら説明を出せよ」ということですね。  
しかもこれ、聞いていないときと今後表示しないときとで、どちらもfalseになってしまうの、ちょっとダメなんじゃないかな。（初回は許可されていない上にfalseになるので、判定できない）

------
ということで話がそれましたが、おおよそ以下の実装で許可されたのかどうかなどを判定しています。

``` Kotlin : RequestPermissionLauncher.kt
constructor(activity: AppCompatActivity, permission: String) : this(permission) {
    requestPermissionResultLauncher =
        activity.registerForActivityResult(ActivityResultContracts.RequestPermission()) {
            it.let {
                if (it) return@let PermissionResult.PERMISSION_GRANTED
                else if (activity.shouldShowRequestPermissionRationale(permission)) return@let PermissionResult.PERMISSION_DENIED
                else return@let PermissionResult.PERMISSION_ABSOLUTELY_DENIED
            }.run {
                continuation?.resume(this)
                continuation = null
            }
    }
}
```

そして、 `suspendCancelableCoroutine`でラップすることで、待機可能にしています。

``` Kotlin : RequestPermissionLauncher.kt
suspend fun launch(): PermissionResult {
    continuation?.let { throw IllegalStateException("this launcher has been started.") }

    return suspendCancellableCoroutine { continuation ->
        continuation.invokeOnCancellation {
            this.continuation = null
        }

        this.continuation = continuation
        requestPermissionResultLauncher.launch(permission)
    }
}

```



## さいごに
ライブラリはここに置いてあるので、気になったら見てみてください。
気が向いたら、初回なのかどうかなどを判定していく仕組みも追加していこうかなと。


https://github.com/milkcocoa0902/PermissionUtility