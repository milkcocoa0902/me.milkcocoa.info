import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'
import { Article, ZennArticle, BlogOnlyArticle, ArticleDetail } from '@/interface/article'

const postsDirectory = join(process.cwd(), 'articles')
const blogOnlyPostsDirectory = join(process.cwd(), 'articles', 'blog')

export function getPostSlugs() {
    return fs.readdirSync(postsDirectory)
}

function getBlogOnlyPostSlugs(){
    return fs.readdirSync(blogOnlyPostsDirectory)
}


export function getAllArticles(): Article[] {
    const blogOnlyArticles = getBlogOnlyPostSlugs().map(slug => {
        const realSlug = slug.replace(/\.md$/, '')
        const fullPath = join(blogOnlyPostsDirectory, `${realSlug}.md`)
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data, content } = matter(fileContents)


        return {
            type: "blog",
            title: data['title'],
            slug: realSlug,
            date: data['date'],
            cover: typeof data['cover'] !== "undefined" ? data['cover']: null,
            description: data['description'],
            emoji: data["emoji"],
            published: Boolean(data["published"]),
            tags: data['topics'] || []
        } as BlogOnlyArticle
    })


    const zennArticles = getPostSlugs().filter((slug => slug !== "blog")).map((slug) => {
        const realSlug = slug.replace(/\.md$/, '')
        const fullPath = join(postsDirectory, `${realSlug}.md`)
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data, content } = matter(fileContents)

        return {
            type: "zenn",
            title: data['title'],
            slug: realSlug,
            date: data['date'],
            emoji: data["emoji"],
            published: Boolean(data["published"]),
            tags: data['topics'] || []
        } as ZennArticle
    })


    return Array().concat(zennArticles).concat(blogOnlyArticles).sort((post1, post2) => (post1.date > post2.date ? -1 : 1))
        .filter((article) => (process.env.NODE_ENV === "production") ? article.published: true)
}

export function getArticle(slug: String) {
    const realSlug = slug.replace(/\.md$/, '')
    const fullPath = join(blogOnlyPostsDirectory, `${realSlug}.md`)

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
    } as ArticleDetail
}
