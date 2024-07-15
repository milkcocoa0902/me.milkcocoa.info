---
title: "【Next.js】Markdownの変更を検出してリロードする"
description: ''
date: '2023-10-23T23:36:20.000+09:00'
author:
 name: ここあ
 picture: '/assets/blog/authors/milkcocoa.png'
emoji: "🥐"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
 - Next.js
published: true
---

## この記事はなに？
最近、ポートフォリオのサイトをVue2から移行するためにReactを触り始めて、せっかくなのでブログも構築ってことでmarkdownで記事を書いてSSGして、、、ということを始めたのですが、
tsxとかと同じようにmdを保存したときに即座に反映されて欲しいなと思いました。

ということで、mdを監視して変更があったらそれを反映するようにします。

## 環境
### パッケージなど
Next.js側
- Next.js ... 13.5.6
- npm-run-all ... 4.1.5


監視ツール側
- chokidar ... 3.5.3
- socket.io ... 4.7.2
- ts-node  ... 10.9.1
- typescript ... 5.2.2

### フォルダ構成
ざっくり、以下のようなフォルダ構成とします。だいぶ端折っていますが、`root`直下はNext.jsの構造を持っていて、`tool`以下に監視ツールを入れると思ってください。  
なお、 `[slug].tsx`はブログのメインページと解釈してください

```
root
├─ next.config.js
├─ package.json
├─ .....[slug].tsx
├─ articles
│    ├─ aaaaaa.md
│    └─ bbbbb.md
└─┬ tools
  ├─ package.json
  └─ watch
     └─ article.ts
  
```


## ファイル監視ツールを作成する

まずは記事の根幹である、ファイル監視の部分を作成します。  
tools/watch/article.tsは、おおよそ以下の実装になります。

``` ts : tools/watch/article.ts
import { Server }  from "socket.io";
import chokidar from 'chokidar';

// process.cwd()はtoolsを指す
const watcher = chokidar.watch(`${process.cwd()}/../articles/**/*`);
const io = new Server(11654, {
  cors: {
    origin: "http://127.0.0.1:14617",
    allowedHeaders: ["*"],
    credentials: true,
  }
});


watcher.on('change', () => {
  io.emit('reload');
});
 ```

やっていることは簡単で、`chokidar`を使用してarticlesフォルダを監視して、変更があった際にはWebSocketにイベントを流し込みます。  
今回は、Next.jsの開発サーバを http://127.0.0.1:14617 に見に行っているので、CORSを通してあげます。めんどくさいですね。

## 変更を受け取って再描画する
次に、各ページでイベントを受け取れるようにします。  
ひとまず実装を先に見てください。


``` tsx : [slug].tsx
"use client"
import { useRouter } from "next/navigation";


import { ArticleDetail } from "@/interface/article";
import React, { useEffect } from "react";
import { env } from "process";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

declare global {
    interface Window {
      io: any;
    }
  }

export const BlogMainContent: React.FC<{ article: ArticleDetail }> = (params) => {
    const router = useRouter();

    useEffect(() => {
        let ignore = false;

        if (env.NODE_ENV !== "production") {
            // 本番環境ではない場合、chokidarでファイル監視をしておいてmdが変更されたらWebSocketが飛んでくる
            new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.integrity = "sha384-c79GN5VsunZvi+Q/WObgk2in0CbZsHnjEqvFxC5DxHn9lTfNce2WW6h2pH6u/kF+"
                script.crossOrigin = "anonymous"
                script.src = "https://cdn.socket.io/4.6.0/socket.io.min.js";
                document.body.append(script);

                script.onerror = () => {
                    reject()
                }

                script.onload = () => {
                    const socket = (window.io as any).connect("http://127.0.0.1:11654", {
                        reconnection: true,
                        reconnectionDelay: 1000,
                        reconnectionDelayMax: 5000,
                        reconnectionAttempts: 99999,
                        crossOriginIsolated: false,
                    });
                    resolve(socket)
                }
            }).then((socket: any) => {
                if(ignore) return
                socket.on('reload', () => {
                    router?.refresh()
                });
                
            }).catch(() => {
                console.log('Listen event failed...');
            })
            return () => {
                ignore = true;
            }
        }
    }, []);
    return (
      <>
       { /* コンテンツ */ }
      </>
    )
}

```

`production`環境でない場合、socket.ioを取り込んで監視するようにしています。それだけです。  
## 監視ツールと開発サーバを起動する
### ツール側の設定
ツール側のpackage.jsonで、以下のコマンドを登録しておきます。  
tsのまま実行されて欲しかったので、`ts-node`を入れています。

``` json : tools/package.json
{
  "scripts": {
    "watch:article": "ts-node watch/article.ts"
  },
}

 ```

 ### Next.js側の設定
 Next.js側でも同じように設定しておきます。  
`npm-run-all`を入れることでパラレルでコマンドを実行することができるようになりました。  
ツール側の`watch:article`を呼び出すコマンドを登録しておき、それと開発サーバの立ち上げを並列実行してあげます。

 ``` json: package.json
 {
  "scripts": {
    "watch:article": "pnpm --prefix ./tools run watch:article",
    "next:dev": "next dev",
    "dev": "run-p watch:article next:dev",
    "next:build": "next build",
    "next:start": "next start",
    "next:lint": "next lint"
  },
 }
 
 ```


 これで、mdの変更を検出して反映されるようになるはずです。  
 欲をいえば一覧画面も更新させたかったですが、サーバーコンポーネントのままでいたかったので、今回はやりませんでした。

 ちなみにちなみに、本番ビルドをまだ試していませんm(_ _)m



## 最後に
 ちなみに Next.jsというかReact.js歴3日です。  
 2年くらい触ってるVueより体験が良い気がしてきた。