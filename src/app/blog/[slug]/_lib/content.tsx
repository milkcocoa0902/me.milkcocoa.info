// 投稿詳細画面
"use client"
import { useRouter } from "next/navigation";

import { notFound } from "next/navigation";
import markdownHtml from 'zenn-markdown-html';
import 'zenn-content-css';
import {Box, k} from '@kuma-ui/core'

import { ArticleDetail } from "../../../../interface/article";
import React, { useEffect } from "react";
import { env } from "process";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

declare global {
    interface Window {
      io: any;
    }
  }

const connectToFileWatcher = (router: AppRouterInstance) =>{
    const script = document.createElement('script');
    script.integrity = "sha384-c79GN5VsunZvi+Q/WObgk2in0CbZsHnjEqvFxC5DxHn9lTfNce2WW6h2pH6u/kF+"
    script.crossOrigin = "anonymous"
    script.src = "https://cdn.socket.io/4.6.0/socket.io.min.js";
    document.body.append(script);

    script.onerror = () => {
        console.log('Hot reload disabled.');
    }

    script.onload = () => {
        const socket = (window.io as any).connect("http://localhost:35413", {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 99999,
            crossOriginIsolated: false,
        });

        socket.on('reload', () => {
            router?.refresh()
        });
    }
}

export const BlogMainContent: React.FC<{ article: ArticleDetail }> = (params) => {
    if (!params.article) {
        notFound()
    }
    const router = useRouter()

    // embedOriginは必須？？？
    const html = markdownHtml(params.article?.content, {
        embedOrigin: "https://embed.zenn.studio",
    })
    useEffect(() => {
        import('zenn-embed-elements');
        let ignore = false;
        
        if (process.env.NODE_ENV !== "production") {
            if(!ignore){
                connectToFileWatcher(router)
                return () => {
                    ignore = true;
                }
            }
        }
    }, []);
    return (
        <Box className="znc"
            dangerouslySetInnerHTML={{
                __html: html
            }}
        >
        </Box>

    )
}