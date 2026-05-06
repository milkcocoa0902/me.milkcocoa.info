import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'
import {Article, ArticleDetail, ArticleList} from '@/interface/article'

const articlesDirectory = join(process.cwd(), 'articles')

export function getPostSlugs() {
    return fs.readdirSync(articlesDirectory)
}


export async function getArticles(limit: number, offset: number): Promise<ArticleList> {
    const articles = await getAllArticles()

    return {
        articles: articles.slice(offset, offset + limit),
        totalCount: articles.length
    }
}


export async function getAllArticles(): Promise<Article[]> {
    return  getPostSlugs().map((slug) => {
        const realSlug = slug.replace(/\.md$/, '')
        const articlePath =  join(articlesDirectory, `${realSlug}.md`)

        return {
            realSlug: realSlug,
            articlePath: articlePath
        }
    }).filter((s) => fs.existsSync(s.articlePath))
        .map((s)=>{
        const fileContents = fs.readFileSync(s.articlePath, 'utf8')
        const { data, content } = matter(fileContents)

        return {
            type: "zenn",
            title: data['title'],
            slug: s.realSlug,
            date: data['date'],
            emoji: data["emoji"],
            published: Boolean(data["published"]),
            tags: data['topics'] || [],
            description: data['description'] || ''
        } as Article
    }).sort((post1, post2) => (post1.date > post2.date ? -1 : 1))
        .filter((article) => (process.env.NODE_ENV === "production") ? article.published: true)
}



export async function getArticle(slug: String): Promise<ArticleDetail | null> {
    const realSlug = slug.replace(/\.md$/, '')
    const fullPath = join(articlesDirectory, `${realSlug}.md`)

    if(!fs.existsSync(fullPath)) return null


    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)


    return {
        title: data['title'],
        slug: realSlug,
        date: data['date'],
        content: content,
        description: data['description'],
        emoji: data["emoji"],
        topics: data['topics'] || [],
    } as ArticleDetail
}
