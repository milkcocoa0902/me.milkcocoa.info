import { KumaRegistry } from "@kuma-ui/next-plugin/registry"
import {Header} from "@/app/_common/header";
import {Footer} from "@/app/_common/footer";
import { ContentContainer } from "./_common/contentContainer";
import {Box} from "@kuma-ui/core";
import React from "react";
import {MainContent} from "@/app/_common/mainContent";



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
      <body style={{ margin: 0, padding: 0 }}>
      <KumaRegistry>
          <ContentContainer>
              <Header/>
              {/* main content */}
              <MainContent>
                      {children}
              </MainContent>

              {/* footer */}
              <Footer/>
          </ContentContainer>
              </KumaRegistry>
      </body>
      </html>
  );
}