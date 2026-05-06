// 投稿一覧画面

import {getArticles} from "../../../../lib/api";
import {Article} from "../../../../interface/article";
import {ArticleCard} from '../../_components/articleCard'
import {Metadata} from "next";
import React from "react";
import PageNavigation from "../../_components/pageNavigation";

export async function generateMetadata(): Promise<Metadata> {
    // templateを設定しているので、サイト名は自動で付く
    return {title: 'ブログ'};
}

type ArticleListPageProps = {
    params: Promise<{
        p: string,
    }>
}

const PAGE_LIMIT = 20

export const generateStaticParams = async () => {
    const total = (await getArticles(PAGE_LIMIT, 0)).totalCount
    const pages = Math.ceil(total / PAGE_LIMIT)
    return Array.from({length: pages}, (_, i) => ({p: (i + 1).toString()}))
}

export default async function Articles({ params }: ArticleListPageProps) {
    const page = parseInt((await params).p, 10)
    const articles = (await getArticles(PAGE_LIMIT, (page - 1) * PAGE_LIMIT))
    const totalPage = Math.ceil(articles.totalCount / PAGE_LIMIT)

    return (
        <div className="my-4 rounded-2xl p-4 text-white">
            <h1 className="border-b border-slate-600/80 pb-2 text-4xl font-bold">Articles</h1>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {
                    articles.articles.map((article: Article) => {
                        return (
                            <div key={article.slug}>
                                <a
                                    href={`/articles/${article.slug}`}
                                    className="no-underline text-[#333333]"
                                >
                                    <ArticleCard
                                        slug={article.slug}
                                        title={article.title}
                                        emoji={article.emoji}
                                        published_at={article.date}
                                        background="#87ede5"
                                        tags={article.tags}
                                        caption={article.description}
                                    />
                                </a>
                            </div>
                        )
                    })
                }
            </div>
            <div className="flex flex-col justify-center items-center my-4">
                <PageNavigation current={page} isLastPage={page === totalPage}/>
            </div>
        </div>
    )
}