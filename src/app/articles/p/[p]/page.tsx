// 投稿一覧画面

import {getArticles} from "../../../../lib/api";
import {Article} from "../../../../interface/article";
import {ArticleCard} from '../../_components/articleCard'
import {Metadata} from "next";
import PageNavigation from "../../_components/pageNavigation";
import {notFound} from "next/navigation";
import { CommandPrompt } from "@/app/_common/tui";

type ArticleListPageProps = {
    params: Promise<{
        p: string,
    }>
}

const PAGE_LIMIT = 20
const ARTICLES_DESCRIPTION = "Kotlin・Android・バックエンド開発を中心とした技術記事の一覧です。"

const parsePage = (value: string) => {
    if (!/^\d+$/.test(value)) {
        notFound()
    }

    const page = Number(value)
    if (!Number.isSafeInteger(page) || page < 1) {
        notFound()
    }
    return page
}

const getTotalPages = async () => {
    const totalCount = (await getArticles(PAGE_LIMIT, 0)).totalCount
    return Math.ceil(totalCount / PAGE_LIMIT)
}

export async function generateMetadata({params}: ArticleListPageProps): Promise<Metadata> {
    const page = parsePage((await params).p)
    const totalPages = await getTotalPages()
    if (page > totalPages) {
        notFound()
    }

    const title = page === 1 ? 'ブログ' : `ブログ - ${page}ページ目`
    const url = `https://me.milkcocoa.info/articles/p/${page}`
    return {
        title,
        description: ARTICLES_DESCRIPTION,
        alternates: {canonical: url},
        openGraph: {
            type: "website",
            title,
            description: ARTICLES_DESCRIPTION,
            url,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description: ARTICLES_DESCRIPTION,
        },
    };
}

export const generateStaticParams = async () => {
    const total = (await getArticles(PAGE_LIMIT, 0)).totalCount
    const pages = Math.ceil(total / PAGE_LIMIT)
    return Array.from({length: pages}, (_, i) => ({p: (i + 1).toString()}))
}

export default async function Articles({ params }: ArticleListPageProps) {
    const page = parsePage((await params).p)
    const articles = (await getArticles(PAGE_LIMIT, (page - 1) * PAGE_LIMIT))
    const totalPage = Math.ceil(articles.totalCount / PAGE_LIMIT)
    if (page > totalPage) {
        notFound()
    }

    return (
        <div className="my-6 space-y-6 text-slate-100 sm:my-8">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <CommandPrompt
                    command={`ls -lt ~/articles --page=${page}`}
                    path="~/articles"
                    showCaret
                    as="h1"
                    title="Articles"
                />
                <p className="m-0 font-mono text-xs text-slate-400">
                    total {articles.totalCount} entries | page {page}/{totalPage}
                </p>
            </header>
            <ul className="grid gap-4 lg:grid-cols-2" role="list">
                {
                    articles.articles.map((article: Article) => {
                        return (
                            <li key={article.slug} className="h-full">
                                <ArticleCard
                                    slug={article.slug}
                                    title={article.title}
                                    emoji={article.emoji}
                                    published_at={article.date}
                                    tags={article.tags}
                                    caption={article.description}
                                />
                            </li>
                        )
                    })
                }
            </ul>
            <div className="my-6 flex flex-col items-center justify-center">
                <PageNavigation current={page} isLastPage={page === totalPage}/>
            </div>
        </div>
    )
}
