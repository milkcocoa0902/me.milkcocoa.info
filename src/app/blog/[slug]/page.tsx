// 投稿詳細画面
import { notFound } from "next/navigation";
import {getArticle, getAllArticles} from "../../../lib/api";
import { BlogMainContent } from "./_lib/content";
import type { Metadata } from 'next'
import React from "react";
import {renderArticle} from "@/lib/md";
import {extractToc} from "@/lib/toc";
import {ArticleToc} from "./_components/ArticleToc";

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
    const [y, mo, d] = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
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
    const tocItems = extractToc(renderedContent)

    return (
        <React.Fragment>
            <div className="mx-auto my-6 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 px-4">
                <div
                    className="order-2 lg:order-1 w-full min-w-0 rounded-2xl border border-slate-700/70 bg-slate-900/40 p-4 md:p-6">
                    <div className="mt-2 mb-0 flex items-center justify-center">
                        <img
                            className="m-auto"
                            src={`https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.4/2/svg/${article.emoji.codePointAt(0)?.toString(16)}.svg`}
                            width="64"
                            height="64"
                            alt=""
                        />
                    </div>
                    <div className="mt-4 mb-6 border-b border-slate-600/80 pb-4">
                        <h1 className="text-center text-4xl font-bold text-white">
                            {article.title}
                        </h1>
                        <p className="mt-2 text-center text-sm text-slate-300">
                            {
                                (() => {
                                    let date = new Date(article.date);
                                    return `${convertToDateString(date)} に公開`;
                                })()
                            }
                        </p>
                    </div>
                    <div className="my-2 px-4 md:px-6">
                        <div className="my-4 flex w-full min-h-6 flex-wrap gap-1.5">
                            {article.topics.map((tag) => (
                                <span
                                    key={`${slug}-${tag}`}
                                    className="inline-flex items-center shrink-0 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-200"
                                >
                            #{tag}
                        </span>
                            ))}
                        </div>

                        <BlogMainContent
                            html={renderedContent}
                        />
                    </div>
                </div>
                <aside className="order-1 lg:order-2 sticky top-14 lg:top-24 z-40 self-start">
                    <ArticleToc items={tocItems} />
                </aside>
            </div>
        </React.Fragment>
    )
}