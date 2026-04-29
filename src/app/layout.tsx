import {Header} from "@/app/_common/header";
import {Footer} from "@/app/_common/footer";
import React from "react";
import {MainContent} from "@/app/_common/mainContent";
import "./globals.css"



const siteName= 'ここあさんの倉庫';
const description = 'ここあさんが乱雑にものを置いているようです';
const url = 'https://me.milkcocoa.info';

export const metadata = {
    title: {
        default: siteName,
        /** `next-seo`の`titleTemplate`に相当する機能 */
        template: `%s - ${siteName}`,
    },
    description,
    openGraph: {
        title: siteName,
        description,
        url,
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
    verification: {
        // google: 'サーチコンソールのやつ',
    },
    alternates: {
        canonical: url,
    },
};



export default function RootLayout({
   children,
}: {
  children: React.ReactNode
}) {
  return (
      <html>
      <body className="m-0 p-0" >
      <div className={"min-h-dvh p-0 m-0 text-white"}>
          <Header/>
          {/* main content */}
          <MainContent>
              {children}
          </MainContent>

          {/* footer */}
          <Footer/>
      </div>
      </body>
      </html>
  );
}