import {Header} from "@/app/_common/header";
import {Footer} from "@/app/_common/footer";
import type {Metadata} from "next";
import React from "react";
import {MainContent} from "@/app/_common/mainContent";
import "./globals.css"



const siteName = 'ここあさんの倉庫';
const description = 'Kotlin・Android・バックエンド開発を中心に、技術記事と個人開発プロダクトを公開するmilkcocoaのポートフォリオ。';
const url = 'https://me.milkcocoa.info';

export const metadata: Metadata = {
    metadataBase: new URL(url),
    title: {
        default: siteName,
        template: `%s - ${siteName}`,
    },
    description,
    authors: [{name: 'milkcocoa', url: 'https://github.com/milkcocoa0902'}],
    creator: 'milkcocoa',
    openGraph: {
        title: siteName,
        description,
        url: '/',
        siteName,
        locale: 'ja_JP',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: siteName,
        description,
        site: '@milkcocoa0902',
        creator: '@milkcocoa0902',
    },
};



export default function RootLayout({
   children,
}: {
  children: React.ReactNode
}) {
  return (
      <html lang="ja">
      <body className="m-0 p-0" >
      <div className="m-0 flex min-h-dvh flex-col p-0 text-white">
          <a className="skip-link" href="#main-content">メインコンテンツへ移動</a>
          <Header/>
          <main className="flex-1" id="main-content" tabIndex={-1}>
              <MainContent>
                  {children}
              </MainContent>
          </main>
          <Footer/>
      </div>
      </body>
      </html>
  );
}
