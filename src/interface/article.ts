
export interface Article {
    slug: string,
    title: string,
    date: string,
    emoji: string,
    published: boolean,
    tags: string[],
    type: string,
    description: string,
}

export type ArticleDetail = {
    slug: string,
    title: string,
    description: string,
    date: string,
    content: string,
    emoji: string,
    topics: string[],
}

export interface ArticleList {
    articles: Article[],
    totalCount: number
}