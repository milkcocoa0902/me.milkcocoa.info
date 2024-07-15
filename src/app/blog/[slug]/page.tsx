// 投稿詳細画面
import { notFound } from "next/navigation";
import {Heading, Text, k, Box, Image} from '@kuma-ui/core'
import markdownHtml from 'zenn-markdown-html';
import { getAllArticles, getArticle } from "../../../lib/api";
import { BlogMainContent } from "./_lib/content";
import { Header } from "../../_common/header";
import { Footer } from "../../_common/footer";
import { ContentContainer } from "../../_common/contentContainer";
import { Main } from "../../_common/main";
import Script from "next/script";
import Head from "next/head";
import { exec } from "child_process";

import type { Metadata } from 'next'


export async function generateStaticParams() {
    const articles = await getAllArticles()

    return articles.filter((article) => article.type === 'blog').map((article) => ({
        slug: article.slug,
    }));
};

function splitByChunk(str: string, size: number) {
    const numChunks = Math.ceil(str.length / size)
    const chunks = new Array(numChunks)
    for (let i = 0, x = 0; i < numChunks; ++i, x += size) {
        chunks[i] = str.substr(x, size)
    }
    return chunks
}

function convertToDateString(date: Date){
    const [y, mo, d] = [date.getFullYear(), date.getMonth() + 1, date.getDay()]
    return `${y}-${mo.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const article = await getArticle(params.slug)
    return {
        title: article?.title ?? "",
        openGraph: {
            title: article?.title,
            description: article?.description,
            url: `https://me.milkcocoa.info/blog/${params.slug}`,
            images: {
                url: `https://me.milkcocoa.info/images/${params.slug}/og.webp`,
                alt: article?.title,
                width: 1200,
                height: 630,
                type: "image/webp",
            }
        },
        twitter: {
            title: article?.title,
            card: "summary_large_image",
            description: article?.description,
            images: {
                url: `https://me.milkcocoa.info/images/${params.slug}/og.webp`,
                alt: article?.title,
                width: 1200,
                height: 630,
                type: "image/webp"
            }
        },
    };
}



export default async function Article({ params }: { params: { slug: string } }) {
    const article = await getArticle(params.slug)
    if (!article) {
        notFound()
    }
    return (
        <ContentContainer>
            <Header />
            <Main>
                <Box
                    m={"32px 0 0 0 "}
                    p={"auto"}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"center"}
                >
                    <Image
                        m={"auto"}
                        src={`https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.4/2/svg/${article.emoji.codePointAt(0)?.toString(16)}.svg`}
                        width={"64px"}
                        height={"64px"}
                    />

                </Box>
                <Box m={"32px"}>
                    <Heading as={"h1"} textAlign="center" fontSize={"xx-large"} fontWeight={"bold"}>
                        {article.title}
                    </Heading>
                    <Text textAlign="center" fontSize="16px" color="#666666">
                        {
                        (()=>{
                            let date = new Date(article.date);
                            return `${convertToDateString(date)} に公開`;
                        })()
                        }
                    </Text>
                </Box>
                <Box bgColor={"white"} p={"16px 64px"} m={"16px 0"} borderRadius={"16px"}>
                    <BlogMainContent
                        article={article}
                    />

                </Box>
            </Main>
            <Footer />
        </ContentContainer>

    )
}