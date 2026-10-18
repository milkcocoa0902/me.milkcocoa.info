// 投稿詳細画面
import { notFound } from "next/navigation";
import {getArticle, getAllArticles} from "../../../lib/api";
import { ArticleBody } from "./_components/ArticleMainContent";
import type { Metadata } from 'next'
import {renderArticle} from "@/lib/md";
import {extractToc} from "@/lib/toc";
import {ArticleToc} from "./_components/ArticleToc";
import { CommandPrompt, TuiBadge, TuiPanel } from "@/app/_common/tui";

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
            <div className="mx-auto my-6 w-full max-w-6xl space-y-4 px-2 sm:my-8 sm:px-4">
                <CommandPrompt
                    command={`bat ~/articles/${slug}.md`}
                    path="~/articles"
                    showCaret
                />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
                    <aside className="sticky top-14 z-[2000] self-start lg:col-start-2 lg:row-start-1 lg:top-20 lg:z-auto">
                        <ArticleToc items={tocItems} />
                    </aside>
                    <article className="w-full min-w-0 lg:col-start-1 lg:row-start-1">
                        <TuiPanel
                            decorativeHeader
                            title={`${slug}.md`}
                            meta="markdown"
                            bodyClassName="p-4 sm:p-6 md:p-8"
                        >
                            <header className="mb-6 border-b border-slate-800 pb-6">
                                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                                    <span
                                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xs border border-slate-800 bg-slate-950/80 text-4xl leading-none"
                                        aria-hidden="true"
                                    >
                                        {article.emoji}
                                    </span>
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <h1 className="text-2xl font-bold leading-tight text-slate-50 sm:text-3xl md:text-4xl">
                                            {article.title}
                                        </h1>
                                        <p className="m-0 font-mono text-xs text-slate-400 sm:text-sm">
                                            <span aria-hidden="true" className="text-teal-400">published_at: </span>
                                            <time dateTime={toIsoDate(article.date) ?? article.date} className="text-slate-200">
                                                {`${convertToDateString(new Date(article.date))} に公開`}
                                            </time>
                                        </p>
                                    </div>
                                </div>

                                {article.topics.length > 0 && (
                                    <div className="mt-4 flex w-full flex-wrap gap-1.5">
                                        {article.topics.map((tag) => (
                                            <TuiBadge key={`${slug}-${tag}`} tone="cyan" prefix="#">
                                                {tag}
                                            </TuiBadge>
                                        ))}
                                    </div>
                                )}
                            </header>

                            <div className="my-2">
                                <ArticleBody html={renderedContent} />
                            </div>
                        </TuiPanel>
                    </article>
                </div>
            </div>
        </>
    )
}
