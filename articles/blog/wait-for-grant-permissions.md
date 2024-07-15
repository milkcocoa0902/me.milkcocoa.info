---
title: "権限リクエストを待機可能にする"
emoji: "⛳"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [Android]
published: false
---

Android開発をしていてユーザに必要な権限を要求するとき、その結果を待機したいことってありますよね？ないですかそうですか......  
僕は待機したい人なので、どうにかこうにか待機できるようにしてみました。  

## 環境
執筆するにあたっての条件です。
- Android Studio 

## 実装
```RequestPermissionLauncher.kt:kotlin
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class StartForActivityResultLauncher private constructor() {
    constructor(fragment: Fragment) : this() {
        activityResultLauncher = fragment.registerForActivityResult(ActivityResultContracts.StartForActivityResult()) { result ->
            continuation?.resume(result)
        }
    }

    constructor(activity: AppCompatActivity) : this() {
        activityResultLauncher = activity.registerForActivityResult(ActivityResultContracts.StartForActivityResult()) { result ->
            continuation?.resume(result)
        }
    }

    var continuation: CancellableContinuation<Uri?>? = null
    private lateinit var activityResultLauncher: ActivityResultLauncher<ActivityResult>

    suspend fun launch(intent: Intent): ActivityResult? {
        return suspendCancellableCoroutine { continuation ->
            this.continuation = continuation
            activityResultLauncher.launch(intent)
            continuation.invokeOnCancellation {
                this.continuation = null
            }
        }
    }
}
```

## 使用方法


ちなみに同じように実装していけば、例えば `ActivityResultConstracts.StartActivityForResult()` とかも待機できるようになります。  
また、UIスレッドもブロックしないので、ANRとかにもなりません

