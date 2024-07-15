---
title: "JetBrainsのWritersideを試してみた"
emoji: "🗂"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
    - JetBrains
    - Writerside
    - IDE 
    - Markdown

published: true
---

## この記事はなに？
2023年10月中旬くらいにJetBrainsからWritersideという、ドキュメント執筆に注力したツールが出たらしいので触ってみました。その感想？です。
https://www.jetbrains.com/ja-jp/writerside/

殴り書きなのでおかしいところがちょいちょいあるかもしれません



## とりあえず使ってみる
インストールして起動してみます。  
起動後の画面は他の製品と大差ないですね。

![](/images/hello-jetbraing-writerside/001_welcome.png)


### プロジェクトの作成.....したあと
ひとまずプロジェクトを新規作成してみました。  
なんか動画がありますが、これもよく見る画面ですね。

![](/images/hello-jetbraing-writerside/002_create_after_project.png)

あとは、なんかテンプレートがプロジェクトに入っていました。テンプレート選択したっけな。。。。
![](/images/hello-jetbraing-writerside/003_template.png)


### 新しいTopicの作成
サイドメニューの＋で新しいファイルを作ることができます。この単位をトピックと呼ぶそうです。  
MarkdownとXMLを扱えるようですが、今回はMarkdownにしました。  

![](/images/hello-jetbraing-writerside/004_create_topinc.png)


トピックを作成するとき、ファイル名とトピックのタイトルを別々に入力することができます。  
ということで、タイトルを「次のトピック」にして作成したものがこちら

```
# &#27425;&#12398;&#12488;&#12500;&#12483;&#12463;

Start typing here...

```

1行目にタイトルが書かれます。エスケープされて読めねぇ。。。。。
また、プレビュー画面の下部に注目すると、ナビゲーションが生えてきています。嬉しいですね。


### 引用
引用の記法を試してみました。
```
> 引用のメッセージです。  
> `{style="note"}`とすると、付加情報っぽいやつになります。
{style="note"}

> 引用のメッセージです。  
> `{style="note"}`とすると、エラーぽくになります。
{style="warning"}
```

このように書いたとき、以下のようになります。  
![](/images/hello-jetbraing-writerside/005_quote.png)

引用ブロックの下に属性を書いてあげることで装飾できるようです。ちょっと面白いですね。

### タブ

他にも、タブ機能を試してみます。
```
<tabs>
<tab title="タブ1" >
 タブの内容その1
</tab>
<tab title="タブ2" >
タブの内容その2
</tab>
</tabs>
```

![](/images/hello-jetbraing-writerside/006_tab.png)

このように書くと、文書内にタブを埋め込むことができます。


## HTMLを吐いてみる
なんと、書いたものをHTMLとして吐き出すことができるらしいです。  
CIにも組み込めるみたいですが、今回は試しません。

https://www.jetbrains.com/help/writerside/local-build.html

ということで手元でのビルドを試してみましょう。

### ビルド構成を追加する
プロジェクトを作成してすぐは、ビルドのための構成がないので作成する必要があります。

![](/images/hello-jetbraing-writerside/007_create_configuration.png)

そしたら、実行してみます。

zipファイルが出てくるので、解凍して開いてみましょう。

![](/images/hello-jetbraing-writerside/008_export.png)

ローカルで開いてるからか、サイドバーがうまく読まれていなかったりナビゲーションがエラーになりますが、いい感じなページを出力することができました。  

## まとめ
それっぽい文書を、簡単に作ることができます。  
が、PDFに出力できない（JetBrainsのチームは、htmlで十分と言っている）、既存のサイトがある場合、形式を合わせるのが難しいといった課題はありそうですが、十分に使えるツールかなとは思います。すぐに飽きてVSCodeに戻ってしまうかもしれませんが。