"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";

type Socket = {
    on: (event: string, listener: () => void) => void;
    disconnect: () => void;
}

type SocketIo = {
    connect: (url: string, options: Record<string, unknown>) => Socket;
}

declare global {
    interface Window {
        io?: SocketIo;
    }
}

const SCRIPT_ID = "article-dev-socket-io";

export function ArticleDevWatcher() {
    const router = useRouter();

    useEffect(() => {
        let socket: Socket | undefined;
        let disposed = false;

        const connect = () => {
            if (disposed || !window.io) return;

            socket = window.io.connect("http://localhost:35413", {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 99999,
                crossOriginIsolated: false,
            });
            socket.on("reload", () => router.refresh());
        };

        const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (existingScript) {
            if (window.io) connect();
            else existingScript.addEventListener("load", connect, {once: true});
        } else {
            const script = document.createElement("script");
            script.id = SCRIPT_ID;
            script.integrity = "sha384-c79GN5VsunZvi+Q/WObgk2in0CbZsHnjEqvFxC5DxHn9lTfNce2WW6h2pH6u/kF+";
            script.crossOrigin = "anonymous";
            script.src = "https://cdn.socket.io/4.6.0/socket.io.min.js";
            script.addEventListener("load", connect, {once: true});
            document.body.appendChild(script);
        }

        return () => {
            disposed = true;
            existingScript?.removeEventListener("load", connect);
            socket?.disconnect();
        };
    }, [router]);

    return null;
}
