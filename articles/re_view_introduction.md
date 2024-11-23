---
title: "Re:VIEWに入門する"
description: ''
date: '2024-11-23T23:25:40.000+09:00'
emoji: "💨"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
  - ReVIEW
  - 技術書執筆
published: true
---

こんばんは、ここあです。  
今回は、技術系同人誌の執筆によく使われている（らしい）、`Re:VIEW`というものを導入してみます。  

dockerが事前に導入されているものとし、爆速で終わらせます。  

## プロジェクトの作成
Re:VIEWのdockerイメージが配布されているので、これを利用することにします。

```bash
docker run -t --user $(id -u):$(id -g) -w /book --rm -v $(pwd):/book vvakame/review:5.8 /bin/bash -ci "review-init sample"
```


実行したら潜って中身を見てみます。
```bash
cd sample
ls -l

total 92
-rw-r--r-- 1 xxxxxx xxxxxx 24928 11月 23 22:35 book.pdf
-rw-r--r-- 1 xxxxxx xxxxxx    52 11月 23 22:34 catalog.yml
-rw-r--r-- 1 xxxxxx xxxxxx 22984 11月 23 22:34 config.yml
drwxr-xr-x 2 xxxxxx xxxxxx  4096 11月 23 22:34 doc
-rw-r--r-- 1 xxxxxx xxxxxx    64 11月 23 22:34 Gemfile
drwxr-xr-x 2 xxxxxx xxxxxx  4096 11月 23 22:34 images
drwxr-xr-x 3 xxxxxx xxxxxx  4096 11月 23 22:34 lib
-rw-r--r-- 1 xxxxxx xxxxxx    66 11月 23 22:34 Rakefile
-rw-r--r-- 1 xxxxxx xxxxxx     2 11月 23 22:34 sample.re
drwxr-xr-x 2 xxxxxx xxxxxx  4096 11月 23 22:34 sty
-rw-r--r-- 1 xxxxxx xxxxxx  8056 11月 23 22:34 style.css
```

## 設定
後々のために、本当にちょっとだけいじります。    
原稿置き場を変えるだけ。

Re:VIEWプロジェクトの設定は`config.yml`を利用します。
```diff: config.yml
# reファイルを格納するディレクトリ。省略した場合は以下 (. はカレントディレクトリを示す)
- # contentdir: .
+ contentdir: articles
```

原稿置き場を変えたので、ディレクトリを用意し、もとからある原稿を移動しておきます。

```bash
mkdir articles
mv sample.re articles/
```


原稿をPDFにするには、次のコマンドです。

```bash
docker run -t --user $(id -u):$(id -g) -w /book --rm -v $(pwd):/book vvakame/review:5.8 /bin/bash -ci "rake pdf"
```
プロジェクト直下に`book.pdf`ができているはずです。  

おしまい。

## textlintの導入
ついでなので、 `textlint`を入れます。  
文章構成のためのツールです。
```bash
docker run -t --user $(id -u):$(id -g) -w /book --rm -v $(pwd):/book node:23.3.0-alpine3.20 /bin/sh -ci "npm install -D textlint-plugin-review textlint-rule-preset-ja-technical-writing textlint-rule-prh"
```

導入したら、初期化して設定ファイルを生成します。
```bash
docker run -t --user $(id -u):$(id -g) -w /book --rm -v $(pwd):/book node:23.3.0-alpine3.20 /bin/sh -ci "npx textlint --init"
```

`.textlintrc.json`が生成されています。

```json:.textlintrc.json
{
  "plugins": {
    "review": true
  },
  "filters": {},
  "rules": {
    "preset-ja-technical-writing": true,
    "prh": true
  }
}
```
このままでも良いのですが、少しいじります。
`prh`というディレクトリを作成し、ここに辞書を入れていくことにします。  
今回は[これ](https://github.com/TechBooster/ReVIEW-Template/blob/master/prh-rules/media/WEB%2BDB_PRESS.yml)をお借りすることにします。

```bash
mkdir prh
wget -O prh/ruleset.yml https://raw.githubusercontent.com/TechBooster/ReVIEW-Template/refs/heads/master/prh-rules/media/WEB%2BDB_PRESS.yml
```

そしたら、`.textlintrc.json`にルールを追加してあげます。

```diff: .textlintrc.json
{
  "plugins": {
    "review": true
  },
  "filters": {},
  "rules": {
    "preset-ja-technical-writing": true,
-    "prh": true
+    "prh": {
+      "rulePaths": [
+        "./prh/rules.yml"
+      ]
+    }
  }
}
```

`textlint`を試す前に、もともと存在している原稿を修正しておきます。

```diff: sample.re
+ = テスト
+
+ファイアウォール
+ファイアーウォール
```

そしたら、`textlint`を実行してみます。
```
docker run -t --user $(id -u):$(id -g) -w /book --rm -v $(pwd):/book node:23.3.0-alpine3.20 /bin/sh -ci "npx textlint **/*.re"

/book/articles/sample.re
  4:1  ✓ error  ファイアーウォール => ファイアウォール  prh
  4:9  error    文末が"。"で終わっていません。          ja-technical-writing/ja-no-mixed-period

✖ 2 problems (2 errors, 0 warnings)
✓ 1 fixable problem.
```
また、自動で修正したい場合には 以下のように `--fix`をつけると、修正可能な範囲で修正してくれます。
```bash
docker run -t --user $(id -u):$(id -g) -w /book --rm -v $(pwd):/book node:23.3.0-alpine3.20 /bin/sh -ci "npx textlint --fix **/*.re"

/book/articles/sample.re
  4:1  ✔   ファイアーウォール => ファイアウォール  prh

✔ Fixed 1 problem
✖ Remaining 1 problem
```

:::: message alert
もとの原稿が上書きされてしまうことに注意です。
::::


## GitHub Actions
GitHubに上げたときに、自動で校正とPDF出力をするようにします。  
めんどくさいのでブランチは`main`一刀流です。  

```bash
mkdir .github/workflows
```

そしたら、 `.github/workflows/main.yml`に枠フローを書いていきます。

:::: details ワークフローの中身
```yaml: main.yml
name: Lint and Build Workflow

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  # textlintを実行するジョブ
  textlint:
    runs-on: ubuntu-latest

    steps:
      # リポジトリをクローン
      - name: Checkout code
        uses: actions/checkout@v3

      # Node.jsをセットアップ
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 23

      # 必要なパッケージをインストール
      - name: Install dependencies
        run: npm install

      # textlintを実行
      - name: Run textlint
        run: npx textlint "**/*.re"

  # pdfmakerを実行するジョブ
  pdfmaker:
    runs-on: ubuntu-latest
    container: vvakame/review:5.8

    steps:
      # リポジトリをクローン
      - name: Checkout code
        uses: actions/checkout@v3

      # 必要なパッケージをインストール
      - name: Install dependencies
        run: bundle install

      # PDFを生成
      - name: Generate PDF with Re:View
        run: rake pdf

      # 生成したPDFをアーティファクトとして保存
      - name: Upload PDF artifact
        uses: actions/upload-artifact@v3
        with:
          name: generated-pdf
          path: ./book.pdf
```
::::

これをGitHubにpushすると、`textlint`が失敗し、勝手にPDFが出力されました。

![](/images/re_view_introduction/001.png)