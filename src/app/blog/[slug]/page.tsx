// 投稿詳細画面
import { notFound } from "next/navigation";
import {getArticle, getAllArticles} from "../../../lib/api";
import { BlogMainContent } from "./_lib/content";
import type { Metadata } from 'next'
import React from "react";
import {renderArticle} from "@/lib/md";

type ArticlePageProps = {
    params: Promise<{ slug: string }>
}

export const generateStaticParams = async  () => {
    const articles = await getAllArticles()

    return articles.map((article) => ({
        slug: article.slug,
    }));
};


function convertToDateString(date: Date){
    const [y, mo, d] = [date.getFullYear(), date.getMonth() + 1, date.getDay()]
    return `${y}-${mo.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`
}

export async function generateMetadata({ params }: ArticlePageProps ): Promise<Metadata> {
    const slug = (await params).slug
    const article = await getArticle(slug)
    return {
        title: article?.title ?? "",
        openGraph: {
            title: article?.title,
            description: article?.description,
            url: `https://me.milkcocoa.info/blog/${slug}`,
            images: {
                url: `https://me.milkcocoa.info/blog/${slug}/opengraph-image`,
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
                url: `https://me.milkcocoa.info/blog/${slug}/opengraph-image`,
                alt: article?.title,
                width: 1200,
                height: 630,
                type: "image/webp"
            }
        },
    };
}



export default async function Article({params}: ArticlePageProps ) {
    const slug = (await params).slug
    const article = await getArticle(slug)
    if (!article) {
        notFound()
    }

    const renderedContent = await renderArticle(article)

    return (
        <React.Fragment>
            <div className="mt-8 mb-0 flex items-center justify-center">
                <img
                    className="m-auto"
                    src={`https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.4/2/svg/${article.emoji.codePointAt(0)?.toString(16)}.svg`}
                    width="64"
                    height="64"
                    alt=""
                />
            </div>
            <div className="m-8">
                <h1 className="text-center text-4xl font-bold">
                    {article.title}
                </h1>
                <p className="text-center text-base text-[#666666]">
                    {
                        (() => {
                            let date = new Date(article.date);
                            return `${convertToDateString(date)} に公開`;
                        })()
                    }
                </p>
            </div>
            <div className="bg-white p-4 my-4 rounded-2xl">
                <div className="flex justify-start items-center gap-2 overflow-x-auto mb-4">
                    {
                        article.topics.map((topic) => (
                            <React.Fragment key={topic}>
                                <div className="bg-blue-50 rounded-2xl px-3 py-1 shrink-0">
                                    <span className="text-sm text-[#666666]">
                                        {topic}
                                    </span>
                                </div>
                            </React.Fragment>
                        ))
                    }
                </div>
                <BlogMainContent
                    html={renderedContent}
                />
            </div>
        </React.Fragment>
    )
}