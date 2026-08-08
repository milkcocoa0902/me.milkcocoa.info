// 投稿詳細画面
import { notFound } from "next/navigation";
import {getArticle, getAllArticles} from "../../../lib/api";
import { ArticleBody } from "./_components/ArticleMainContent";
import type { Metadata } from 'next'
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

const toIsoDate = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export async function generateMetadata({ params }: ArticlePageProps ): Promise<Metadata> {
    const slug = (await params).slug
    const article = await getArticle(slug)
    if (!article) {
        notFound()
    }

    const url = `https://me.milkcocoa.info/articles/${slug}`
    const publishedTime = toIsoDate(article.date)
    return {
        title: article.title,
        description: article.description,
        alternates: {canonical: url},
        openGraph: {
            type: "article",
            title: article.title,
            description: article.description,
            url,
            publishedTime,
            authors: ["milkcocoa"],
            images: {
                url: `https://me.milkcocoa.info/articles/${slug}/opengraph-image`,
                alt: article.title,
                width: 1200,
                height: 630,
                type: "image/png",
            }
        },
        twitter: {
            title: article.title,
            card: "summary_large_image",
            description: article.description,
            images: {
                url: `https://me.milkcocoa.info/articles/${slug}/opengraph-image`,
                alt: article.title,
                width: 1200,
                height: 630,
                type: "image/png"
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
    const articleUrl = `https://me.milkcocoa.info/articles/${slug}`
    const jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: article.title,
        description: article.description,
        datePublished: toIsoDate(article.date) ?? article.date,
        author: {
            "@type": "Person",
            name: "milkcocoa",
            url: "https://me.milkcocoa.info/",
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": articleUrl,
        },
        url: articleUrl,
    }).replace(/</g, "\\u003c")

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}} />
            <div className="mx-auto my-6 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 px-4">
                <aside className="sticky top-14 z-[2000] self-start lg:col-start-2 lg:row-start-1 lg:top-24 lg:z-auto">
                    <ArticleToc items={tocItems} />
                </aside>
                <article
                    className="w-full min-w-0 rounded-2xl border border-slate-700/70 bg-slate-900/40 p-4 md:p-6 lg:col-start-1 lg:row-start-1">
                    <div className="mt-2 mb-0 flex items-center justify-center">
                        <span className="m-auto text-6xl leading-none" aria-hidden="true">{article.emoji}</span>
                    </div>
                    <div className="mt-4 mb-6 border-b border-slate-600/80 pb-4">
                        <h1 className="text-center text-4xl font-bold text-white">
                            {article.title}
                        </h1>
                        <p className="mt-2 text-center text-sm text-slate-300">
                            <time dateTime={toIsoDate(article.date) ?? article.date}>
                                {`${convertToDateString(new Date(article.date))} に公開`}
                            </time>
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

                        <ArticleBody
                            html={renderedContent}
                        />
                    </div>
                </article>
            </div>
        </>
    )
}
