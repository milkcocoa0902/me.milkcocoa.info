---
title: "Kotlin.RPCを試してみる"
emoji: "🙌"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
    - Kotlin
    - Ktor
    - RPC
published: false
---

KotlinのRPCライブラリがJetBrainsからリリースされたので試してみました。

::: message
今回紹介するものは、gRPCではなく、あくまでもRPCです。
ただし、ライブラリの発端は [KtorでgRPCを使いたい](https://youtrack.jetbrains.com/issue/KTOR-1501/Add-gRPC-support-to-Ktor-with-a-generator-plugin-and-tutorial)という要望で、そのマイルストーンとして今回のRPCライブラリが存在しています。
つまり、近い将来にJetBrains謹製のgRPCライブラリが登場するものと思われます。
:::

https://github.com/Kotlin/kotlinx-rpc


## 今回の構成

### 共通プロジェクト
共通プロジェクトでは、サーバ側とクライアント側の両方で使用するためのモデルとサービスを定義します。

### サーバ側プロジェクト
サーバ側プロジェクトでは、


### クライアント側プロジェクト


