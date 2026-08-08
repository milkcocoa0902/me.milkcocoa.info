// 投稿一覧画面

import {getArticles} from "../../../../lib/api";
import {Article} from "../../../../interface/article";
import {ArticleCard} from '../../_components/articleCard'
import {Metadata} from "next";
import PageNavigation from "../../_components/pageNavigation";
import {notFound} from "next/navigation";

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
        <div className="my-4 rounded-2xl p-4 text-white">
            <h1 className="border-b border-slate-600/80 pb-2 text-4xl font-bold">Articles</h1>
            <ul className="mt-4 grid gap-4 lg:grid-cols-2" role="list">
                {
                    articles.articles.map((article: Article) => {
                        return (
                            <li key={article.slug}>
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
            <div className="flex flex-col justify-center items-center my-4">
                <PageNavigation current={page} isLastPage={page === totalPage}/>
            </div>
        </div>
    )
}
