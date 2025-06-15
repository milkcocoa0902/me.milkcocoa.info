---
title: "デジタルアドレスAPIライブラリを実装している話"
description: ''
date: '2025-06-15T16:45:00.000+09:00'
emoji: "📘"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
  - Kotlin
  - Ktor
  - デジタルアドレス
  - 日本郵政
published: true
---

こんにちは、ここあです。  
最近は日本郵便のデジタルアドレスAPIや郵便番号APIを簡単に利用できるKotlinマルチプラットフォームライブラリ「Latte」の開発を進めており、それの紹介です。

::: message
この記事はJetBrains社が提供するJunieを用いて執筆・添削をしています。
:::

https://github.com/milkcocoa0902/Latte

## Latteとは？

Latteは、日本郵便が提供するデジタルアドレスAPIと郵便番号APIにアクセスするためのKotlinマルチプラットフォームライブラリです。

### 主な特徴

✅ 日本郵便の各種APIに対応  
✅ 直接利用とプロキシ利用の両方をサポート  
✅ トークンの自動再利用機能  
✅ Kotlin Coroutines対応  
✅ クロスプラットフォーム

## 使い方

### 基本的な使い方

まずはLatteクライアントを作成します：

```kotlin
// APIに直接接続する場合
val latte = Latte.of(
  url = "https://stb-ssss.da.pf.japanpost.jp",
  clientId = "<your client id>",
  secretKey = "<your secret key>",
)

// プロキシを使用する場合
val latte = Latte.of(
    ConnectionInfo.Proxy(
        host = "http://localhost:12345"
    ).with(DefaultCredentialsProvider)
)
```

### トークン管理

Latteはトークンの取得と管理を簡単にします：

```kotlin
// トークンを取得
val token = latte.token()

// または、withToken()を使って自動的にトークンを管理
latte.withToken { token ->
    // ここでAPIを呼び出す
}
```

`withToken()`メソッドは、トークンが有効期限内であれば再利用し、期限切れの場合は自動的に新しいトークンを取得します。

### 住所検索

郵便番号やデジタルアドレスから住所を検索する例：

```kotlin
latte.withToken { token ->
    val result = latte.search(
        token = token,
        searchCode = "100",  // 郵便番号やデジタルアドレス
        params = SearchCodeRequest(
            limit = 50,
            choiki = ChoikiType.WithoutBrackets
        )
    )
    
    // 結果を処理
    result.data.forEach { address ->
        println("${address.zipCode}: ${address.prefecture}${address.city}${address.town}")
    }
}
```

### 郵便番号検索

住所情報から郵便番号を検索する例：

```kotlin
latte.withToken { token ->
    val result = latte.addressZip(
        token = token
    ){
        // DSLスタイルでリクエストを構築
        this.prefCode = "13"  // 東京都
        this.cityName = "足立区"
    }
    
    // 結果を処理
    result.data.forEach { zipCode ->
        println("${zipCode.zipCode}: ${zipCode.prefName}${zipCode.cityName}${zipCode.townName}")
    }
}
```

## プロキシサーバーの活用

ここでいうプロキシサーバとは、いわゆる日本郵便APIとクライアントの間に構築する中間サーバを指します。  
プロキシサーバを利用することで、以下のメリットが見込まれます。

1. **セキュリティ向上**: クライアントアプリにAPIキーを埋め込む必要がない
2. **リソース共有**: 複数のクライアントで認証情報を共有できる
3. **レート制限管理**: APIの呼び出し回数を制限・管理できる
4. **CORS対応**: Webフロントからでも呼び出しができる......つもり

### プロキシサーバーのセットアップ

1. 環境変数を設定（`.env`ファイル）：

```
# 日本郵便API設定
LATTE_ENDPOINT_URL=https://stb-ssss.da.pf.japanpost.jp
LATTE_CLIENT_ID=your_client_id
LATTE_SECRET_KEY=your_secret_key

# プロキシサーバー設定
LATTE_SERVER_PORT=12345
LATTE_TOKEN_REFILL_PERIOD=300
LATTE_CALL_TOKEN_COUNT=60
```

2. プロキシサーバーを起動：

```bash
cd server
./gradlew run
```

3. クライアントからプロキシを利用：

```kotlin
val latte = Latte.of("http://localhost:12345")

// 通常通りAPIを利用
latte.withToken { token ->
    // APIを呼び出す
}
```

## 実装の詳細

Latteは内部でKtorを使用してHTTPリクエストを行い、Kotlin Serializationを使用してJSONデータをシリアライズ/デシリアライズします。エラーハンドリングも組み込まれており、ネットワークエラーやAPIエラーを適切に処理します。

```kotlin
// 内部実装の例（簡略化）
suspend fun token(): TokenResponse {
    return executeCatching {
        ktorHttpClient().post(connectionInfo.host.trimEnd('/') + connectionInfo.tokenPath) {
            // リクエスト設定
        }
    }
}
```

## まとめ

Latteを使うことで、日本郵便のデジタルアドレスAPIや郵便番号APIを簡単に利用できます。トークン管理やエラーハンドリングなどの面倒な処理はライブラリが担当するので、開発者はビジネスロジックに集中できます。

また、プロキシサーバーを活用することで、セキュリティの向上やリソースの共有も実現できます。

Kotlinマルチプラットフォームに対応しているため、Android、iOS、Webなど、様々なプラットフォームで同じコードを使用できるのも大きなメリットです。
