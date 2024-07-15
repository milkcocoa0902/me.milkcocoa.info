---
title: "ATProtocol用のKotlinライブラリを実装している話【1】"
emoji: "🦋"
type: "tech" # tech: 技術記事 / idea: アイデア
topics:
    - ATProtocol
    - Bluesky
published: false
---

こんにちは、ここあです。
書きかけの記事がたくさんあります。書いている間に飽きてしまいますね、どうしよう。
今回は、ATProtocolのライブラリをKotlin向けに実装しているので、それについて書いてみようかなと。


## ATProtocolって？
有名どころで言うと、Blueskyに使用されているプロトコルです。
あくまで、ATProtocolが先にあり、それを利用したアプリケーションとしてBlueskyが存在しているという立ち位置になります。

詳しい説明は気が向いたら書きます。

## APIをcurlで叩いてみる

### 認証

### タイムラインの取得


## Kotlinで叩いてみる
ようやく本題です。
KotlinでATProtocolを叩くためのライブラリの開発をしています。
まだまだバグだらけですが、一応Maven Centralから取得できます。
以下のライブラリを導入することで、ATProtocolのコアAPIを利用することができます。

```
implementation("io.github.milkcocoa0902:milkyway-core:0.0.8")
```

### 認証

### タイムラインの取得
タイムラインは、ATProtocol本体ではなく、Bluesky独自の実装になります。
milkywayでは、そのようなものはコアライブラリから独立したライブラリになっています。
そのため、追加の依存関係が必要になります。

```
implementation("io.github.milkcocoa0902:milkyway-bsky:0.0.8")
```


```
Milkyway.installBskyDependencies()
```


## 最後に

