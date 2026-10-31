"use client";

import {useEffect, useRef} from "react";

let nextDiagramId = 0;
let mermaidPromise: Promise<typeof import("mermaid")["default"]> | undefined;

function loadMermaid() {
    mermaidPromise ??= import("mermaid").then(({default: mermaid}) => {
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: "base",
            look: "classic",
            themeVariables: {
                darkMode: true,
                background: "#0f172a",
                primaryColor: "#164e63",
                primaryTextColor: "#e2e8f0",
                primaryBorderColor: "#5eead4",
                secondaryColor: "#1e293b",
                tertiaryColor: "#0f172a",
                lineColor: "#94a3b8",
                textColor: "#e2e8f0",
                clusterBkg: "#0f172a",
                clusterBorder: "#475569",
                edgeLabelBackground: "#0f172a",
            },
            fontFamily: "sans-serif",
            suppressErrorRendering: true,
        });
        return mermaid;
    }).catch((error) => {
        mermaidPromise = undefined;
        throw error;
    });
    return mermaidPromise;
}

export function ArticleHtml({html, className}: {html: string; className: string}) {
    const root = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const diagrams = Array.from(root.current?.querySelectorAll<HTMLDivElement>("[data-mermaid]") ?? []);
        if (!diagrams.length) return;
        let cancelled = false;
        const restores: (() => void)[] = [];

        async function renderDiagrams() {
            try {
                const mermaid = await loadMermaid();
                await document.fonts.ready;
                for (const diagram of diagrams) {
                    if (cancelled) return;
                    const source = diagram.querySelector("pre");
                    if (!source) continue;
                    try {
                        const {svg} = await mermaid.render(`article-mermaid-${nextDiagramId++}`, source.textContent ?? "");
                        if (cancelled) return;
                        const output = document.createElement("div");
                        output.className = "mermaid-output";
                        output.innerHTML = svg;
                        const graphic = output.querySelector("svg");
                        if (graphic && !graphic.hasAttribute("aria-labelledby")) {
                            graphic.setAttribute("role", "img");
                            graphic.setAttribute("aria-label", "Mermaidの図");
                        }
                        diagram.appendChild(output);
                        source.hidden = true;
                        restores.push(() => {
                            output.remove();
                            source.hidden = false;
                        });
                    } catch {
                        if (cancelled) return;
                        const message = document.createElement("p");
                        message.className = "text-sm text-amber-200";
                        message.textContent = "図を表示できなかったため、元のコードを表示しています。";
                        diagram.insertBefore(message, diagram.firstChild);
                        restores.push(() => message.remove());
                    }
                }
            } catch {
                // A failed download must not prevent reading the article or diagram source.
            }
        }

        void renderDiagrams();
        return () => {
            cancelled = true;
            restores.forEach(restore => restore());
        };
    }, [html]);

    return <div ref={root} className={className} dangerouslySetInnerHTML={{__html: html}} />;
}
