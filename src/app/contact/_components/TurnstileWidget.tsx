"use client";

import Script from "next/script";
import {useEffect, useRef, useState} from "react";
import {CONTACT_ACTION} from "@/lib/contact/contract";

type Turnstile = {
    render: (container: HTMLElement, options: {
        sitekey: string; action: string; theme: string; size: string; language: string;
        callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void;
        "response-field": boolean;
    }) => string;
    reset: (id: string) => void;
    remove: (id: string) => void;
};
declare global { interface Window {turnstile?: Turnstile} }

export function TurnstileWidget({siteKey, resetCounter, onToken, onError}: {
    siteKey: string; resetCounter: number; onToken: (token: string) => void; onError: () => void;
}) {
    const container = useRef<HTMLDivElement>(null);
    const widget = useRef<string | undefined>(undefined);
    const [ready, setReady] = useState(false);
    useEffect(() => {
        if (!ready || !container.current || !window.turnstile) return;
        const api = window.turnstile;
        widget.current = api.render(container.current, {
            sitekey: siteKey, action: CONTACT_ACTION, theme: "dark", size: "normal", language: "ja",
            callback: onToken, "expired-callback": () => onToken(""), "response-field": false,
            "error-callback": onError,
        });
        return () => { if (widget.current !== undefined) api.remove(widget.current); widget.current = undefined; };
    }, [ready, siteKey, onToken, onError]);
    useEffect(() => {
        if (widget.current !== undefined) window.turnstile?.reset(widget.current);
    }, [resetCounter]);
    return <>
        <Script id="contact-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive" onReady={() => setReady(true)} onError={onError} />
        <div ref={container} role="group" aria-label="送信前の確認" className="min-h-[65px] w-full min-w-0" />
    </>;
}
