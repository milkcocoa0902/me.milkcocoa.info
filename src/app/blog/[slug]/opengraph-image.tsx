
import { ImageResponse } from 'next/og';
import {getAllArticles, getArticle} from "@/lib/api";
import React from "react";
import {notFound} from "next/navigation";

// Image metadata
export const size = {
    width: 1200,
    height: 630,
};

export const alt = ""

export const contentType = 'image/png';
export const generateStaticParams = async  () => {
    const articles = await getAllArticles()

    return articles.map((article) => ({
        slug: article.slug,
    }));
};

export default async function OpenGraphImage({ params }: {
    params: Promise<{ slug: string }>
}) {
    const post = await getArticle((await params).slug)
    if(!post){
        return notFound()
    }

    try {
        return new ImageResponse(
            (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(to bottom right, #3978d1, #051b39)',
                        borderRadius: '25px',
                        overflow: 'hidden',
                        position: 'relative',
                        padding: '1.4rem',
                    }}
                >
                    <span style={{
                        fontSize: "128px",
                        marginTop: "-75px"
                    }}>
                        {post.emoji}
                    </span>
                    <span style={{fontSize: "48px", color: "white", textAlign: "center"}}>
                        {post.title}
                    </span>
                </div>
            ),
            {
                ...size,
            },
        );
    } catch (error) {
        console.log(error);
        return null;
    }
}