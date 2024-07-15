// 投稿一覧画面

import {getAllArticles} from "@/lib/api";
import {Footer} from "@/app/_common/footer";
import {Header} from "@/app/_common/header";
import {Layout} from "@/app/_common/layout";
import {Main} from "@/app/_common/main";
import {Box, Text} from "@kuma-ui/core";
import {Grid, k} from "@kuma-ui/core";
import {Article, BlogOnlyArticle, ZennArticle} from "@/interface/article";
import {ArticleCard} from '@/app/blog/_components/articleCard'
import {Metadata} from "next";
import {Link} from '@kuma-ui/core'

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

export default async function Articles() {
    const posts = await getAllArticles()
    return (
        <Layout>
            <Header/>
            <Main>
                <Grid
                    gridTemplateColumns={"repeat(auto-fit, minmax(350px, 22%))"}
                    columnGap={"4%"}
                    justifyContent={"center"}>
                    {
                        posts.map((article: Article) => {
                            console.log(isBlogOnlyArticle(article))
                            console.log(isZennArticle(article))
                            if(isBlogOnlyArticle(article)){
                                return (
                                    <Box m={["8px 8px"]} key={article.slug}>
                                        <Link
                                            href={`/blog/${article.slug}`}
                                            style={{ textDecoration: "none" }}
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
                            }else if(isZennArticle(article)){
                                return (
                                    <Box m={["8px 8px"]} key={article.slug}>
                                        <Link
                                            href={`https://zenn.dev/milkcocoa0902/articles/${article.slug}`}
                                            style={{ textDecoration: "none" }}
                                            color={"#333333"}
                                            target={'_blank'}
                                        >
                                            <ArticleCard
                                                slug={article.slug}
                                                title={article.title}
                                                emoji={article.emoji}
                                                published_at={article.date}
                                                background="#87ede5"
                                                tags={article.tags.concat('zenn')}
                                            />
                                        </Link>
                                    </Box>
                                )
                            }
                        })
                    }
                </Grid>
            </Main>
            <Footer/>
        </Layout>
    )
}