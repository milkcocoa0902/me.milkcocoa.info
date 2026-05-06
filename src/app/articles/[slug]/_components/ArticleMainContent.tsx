// 投稿詳細画面
"use client"
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
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
    document.body.appendChild(script);

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

export const ArticleBody: React.FC<{ html: string }> = (params) => {
    const router = useRouter()
    useEffect(() => {
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
        <div
            className={"prose prose-invert max-w-none mx-auto prose-headings:text-white prose-h1:text-4xl prose-h2:text-3xl prose-headings:underline prose-p:text-slate-200 prose-strong:text-slate-100 prose-li:text-slate-200 prose-a:text-cyan-300 hover:prose-a:text-cyan-200 prose-pre:bg-transparent prose-pre:px-4"}
            dangerouslySetInnerHTML={{
            __html: params.html
        }}>
        </div>

    )
}