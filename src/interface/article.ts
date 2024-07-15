export interface Article {
    slug: string,
    title: string,
    date: string,
    emoji: string,
    published: boolean,
    tags: string[],
    type: string,
}

export interface BlogOnlyArticle extends Article{
    type: 'blog',
    description: string,
    cover: string
}

export interface ZennArticle extends Article{
    type: 'zenn',
}

export type ArticleDetail = {
    slug: string,
    title: string,
    description: string,
    date: string,
    content: string,
    emoji: string,
}
