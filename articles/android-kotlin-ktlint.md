---
title: "ktlintでAndroidのコードを静的解析する(Kotlin)"
description: 'Androidプロジェクトにktlintを導入し、Kotlinのコード規約に沿った静的解析や自動整形を行うための設定手順と実行方法を解説しています。'
date: ''
emoji: "🤖"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [Android, Kotlin]
published: false
---

今更ですが、新規に立ち上げたAndroidプロジェクトに[ktlint](https://pinterest.github.io/ktlint/)という静的解析ツールを導入したのでその手順を残しておきたいと思います。

## ktlintとは
[Kotlinのコード規約](https://kotlinlang.org/docs/coding-conventions.html) と [Androidのコード規約](https://developer.android.com/kotlin/style-guide)を元にコードスタイルのチェックをしてくれるKotlin用のLinterです。

## 前提
この記事は、以下の環境を元に執筆しています。
- Android Studio 2021.2.1 Patch 1
- ktlint 0.47.1

## 導入方法
基本的には[ガイド](https://pinterest.github.io/ktlint/install/integrations/#custom-gradle-integration)にしたがって `build.gradle` へ記述を追加するだけです。  
app配下にインストールする記事が多いので、この記事ではマルチモジュールなときの記述を書いてみたいと思います。  
(モジュール単位で導入するときとあまり大差ないですが)

```gradle:build.gradle
configurations {
    ktlint
}

dependencies {
  ktlint("com.pinterest:ktlint:0.47.1") {
    attributes {
      attribute(Bundling.BUNDLING_ATTRIBUTE, getObjects().named(Bundling, Bundling.EXTERNAL))
    }
  }
}

task ktlint(type: JavaExec, group: "verification") {
  description = "Check Kotlin code style."
  classpath = configurations.ktlint
  mainClass.set("com.pinterest.ktlint.Main")
  args "**/src/**/*.kt"
}


task ktlintFormat(type: JavaExec, group: "formatting") {
  description = "Fix Kotlin code style deviations."
  classpath = configurations.ktlint
  mainClass.set("com.pinterest.ktlint.Main")
  args "-F", "**/src/**/*.kt"
}

```
変わったところといえば、対象ファイルの正規表現があらゆるディレクトリ以下の `src`以下になったというところでしょうか。  

## 実行方法
確認用のタスクと整形用のタスクが生えてくるのでそれを実行するだけです。
`gradlew ktlint`とすればスタイルチェック
`gradlew ktlintFormat`とすればスタイルガイドを元に整形