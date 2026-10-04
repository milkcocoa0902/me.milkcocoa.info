import type {MetadataRoute} from "next";
import {getAllArticles} from "@/lib/api";

const siteUrl = "https://me.milkcocoa.info";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const articles = await getAllArticles();
    const staticRoutes: MetadataRoute.Sitemap = [
        {url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1},
        {url: `${siteUrl}/articles/p/1`, changeFrequency: "weekly", priority: 0.9},
        {url: `${siteUrl}/works`, changeFrequency: "monthly", priority: 0.8},
        {url: `${siteUrl}/works/colotok`, changeFrequency: "monthly", priority: 0.8},
        {url: `${siteUrl}/works/cocoadiskinfo`, changeFrequency: "monthly", priority: 0.8},
        {url: `${siteUrl}/gpg`, changeFrequency: "yearly", priority: 0.4},
        {url: `${siteUrl}/bc`, changeFrequency: "monthly", priority: 0.5},
        {url: `${siteUrl}/nbf`, changeFrequency: "yearly", priority: 0.2},
        {url: `${siteUrl}/pantrykeeper`, changeFrequency: "yearly", priority: 0.2},
    ];

    const articleRoutes: MetadataRoute.Sitemap = articles
        .filter((article) => article.published)
        .map((article) => {
            const publishedAt = Date.parse(article.date);
            return {
                url: `${siteUrl}/articles/${article.slug}`,
                ...(Number.isNaN(publishedAt) ? {} : {lastModified: new Date(publishedAt)}),
                changeFrequency: "monthly",
                priority: 0.7,
            };
        });

    return [...staticRoutes, ...articleRoutes];
}
