// 投稿一覧画面

import {getArticles} from "../../../../lib/api";
import {Box, Flex, Text, VStack} from "@kuma-ui/core";
import {Grid, k} from "@kuma-ui/core";
import {Article, BlogOnlyArticle, ZennArticle} from "../../../../interface/article";
import {ArticleCard} from '../../_components/articleCard'
import {Metadata} from "next";
import {Link} from '@kuma-ui/core'
import React from "react";
import PageNavigation from "@/app/blog/_components/pageNavigation";

function isBlogOnlyArticle(arg: any) : arg is BlogOnlyArticle {
    return arg !== null && typeof arg === "object" && arg.type=="blog"
}
function isZennArticle(arg: any) : arg is ZennArticle {
    return arg !== null && typeof arg === "object" && arg.type=="zenn"
}

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
        <React.Fragment>
                <Grid
                    gridTemplateColumns={"repeat(auto-fit, minmax(350px, 31%))"}
                    columnGap={"4%"}
                    justifyContent={"center"}>
                    {
                        articles.articles.map((article: Article) => {
                            return (
                                <Box m={["8px 8px"]} key={article.slug}>
                                    <Link
                                        href={`/blog/${article.slug}`}
                                        style={{textDecoration: "none"}}
                                        color={"#333333"}
                                    >
                                        <ArticleCard
                                            slug={article.slug}
                                            title={article.title}
                                            emoji={article.emoji}
                                            published_at={article.date}
                                            background="#87ede5"
                                            tags={article.tags}
                                        />
                                    </Link>
                                </Box>
                            )
                        })
                    }
                </Grid>
            <Flex justifyContent={"center"} flexDirection={"column"} alignContent={"center"} alignItems={"center"} m={"16px 0"}>
                <PageNavigation current={page} isLastPage={page === totalPage}/>
            </Flex>
        </React.Fragment>
    )
}