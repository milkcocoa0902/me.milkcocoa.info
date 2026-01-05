---
title: "【Next.js】OG画像を自動で生成したい"
description: ''
date: ''
emoji: "⚛️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
    - Nextjs
published: true
---

## この記事はなに？
最近、Next.jsを使ってブログサイトをホストし始めたのですが、OG画像をレンダリングして返してくれる機能があるので、それを試そうとしたときの備忘録です。

:::: message alert
あとから説明しますが、Next.js 13.5.6時点ではSSG、動的ルートと同時にこの機能を使うことのできないバグがあります。  
ということで、黒魔術でOG画像を生成して解決させました。あくまで「自動で生成」ですね。
::::

## 執筆にあたっての条件
- Next.js 13.5.6
- App Router

### フォルダ構成

```
root
├─ next.config.js
├─ package.json
├─ app
│    ├─ ___layout.tsx
│    ├─ page.tsx
│    └─ [slug]
│    　　　├─ ___layout.tsx
│         ├─ ogpengraph-image.tsx
│         └─ page.tsx
└─ articles
     ├─ aaaaaa.md
     └─ bbbbb.md
```


## OG画像を返す
さて、フォルダ構成を眺めていると目に見えてわかるのですが、 `page.tsx`を設置することで、OG画像をレンダリングして返すことができるようになります。
おおよそ実装は次のようになります。(長いので折りたたみます)

:::details OG画像を返す実装
``` tsx : page.tsx
import { ImageResponse } from "next/server";
export const revalidate = "force-cache";
export const runtime = "nodejs";

// OG画像の推奨サイズ
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  // 記事の情報を取得する
  const article = await getArticleDetail(params.slug);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <div
          style={{ height: 40, backgroundColor: "#5AC8D8", width: "100%" }}
        />
        <h1
          style={{
            flex: 1,
            maxWidth: "80%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {article.title}
        </h1>
        <div
          style={{ height: 40, backgroundColor: "#5AC8D8", width: "100%" }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}


export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const article = await getArticle(params.slug)
    return {
        title: article?.title,
        openGraph: {
            title: article?.title,
            description: article?.description,
            url: `https://me.milkcocoa.info/blog/${params.slug}`,
            images: {
                alt: article?.title,
            }
        },
        twitter: {
            title: article?.title,
            card: "summary_large_image",
            description: article?.description,
            images: {
                alt: article?.title,
            }
        },
    };
}

```
:::



## SSGをしたい人へ

### 環境を用意する

### テンプレート画像を用意する

### 画像を生成する