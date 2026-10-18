import Image from "next/image";
import Link from "next/link";
import {Metadata} from "next";
import {type Work, workCount, workItems} from "@/lib/works";
import { CommandPrompt, TuiBadge, TuiPanel } from "@/app/_common/tui";

export const metadata: Metadata = {
    title: "Works",
    description: "milkcocoaが開発したKotlinライブラリ、Androidアプリ、デスクトップツールなどの制作物一覧。",
    alternates: {
        canonical: "/works",
    },
    openGraph: {
        title: "Works - ここあさんの倉庫",
        description: "milkcocoaが開発したKotlinライブラリ、Androidアプリ、デスクトップツールなどの制作物一覧。",
        url: "/works",
        type: "website",
        locale: "ja_JP",
    },
    twitter: {
        card: "summary_large_image",
        title: "Works - ここあさんの倉庫",
        description: "milkcocoaが開発したKotlinライブラリ、Androidアプリ、デスクトップツールなどの制作物一覧。",
        creator: "@milkcocoa0902",
    },
};

function WorkCardContent({item}: {item: Work}) {
    return (
        <>
            <div className="overflow-hidden rounded-xs border border-slate-800 bg-slate-950">
                <Image
                    src={item.image}
                    alt={item.title}
                    sizes="(min-width: 1024px) 43vw, calc(100vw - 3rem)"
                    className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                />
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2">
                <h2 className="font-mono text-lg font-bold text-teal-300 group-hover:text-teal-200 sm:text-xl">
                    {item.title}
                </h2>
                {item.href && (
                    <span
                        aria-hidden="true"
                        className="font-mono text-xs text-slate-400 transition-colors group-hover:text-teal-300"
                    >
                        {item.href.startsWith("/") ? "[open ->]" : "[ext ↗]"}
                    </span>
                )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-200 sm:text-base">{item.description}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
                {item.stack.map((tech) => (
                    <TuiBadge key={`${item.title}-${tech}`} tone="cyan" prefix="#">
                        {tech}
                    </TuiBadge>
                ))}
            </div>
        </>
    );
}

export default function WorksPage() {
    const works = workItems(workCount(), 0);

    return (
        <article className="my-6 space-y-6 text-slate-100 sm:my-8">
            <header className="space-y-3">
                <CommandPrompt
                    command="ls -la ~/works"
                    path="~/works"
                    showCaret
                    as="h1"
                    title="Works"
                />
                <p className="max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                    Kotlinライブラリ、Androidアプリ、デスクトップツールを中心とした制作物を紹介します。
                </p>
            </header>

            <div className="grid gap-4 lg:grid-cols-2">
                {works.map((item, idx) => {
                    const panelTitle = `work.${String(idx).padStart(2, "0")}`;
                    if (!item.href) {
                        return (
                            <section key={item.title} aria-label={item.title}>
                                <TuiPanel decorativeHeader title={panelTitle} className="h-full">
                                    <WorkCardContent item={item} />
                                </TuiPanel>
                            </section>
                        );
                    }

                    if (item.href.startsWith("/")) {
                        return (
                            <Link key={item.title} href={item.href} className="block no-underline">
                                <TuiPanel
                                    decorativeHeader
                                    title={panelTitle}
                                    meta="local"
                                    interactive
                                    className="h-full"
                                >
                                    <WorkCardContent item={item} />
                                </TuiPanel>
                            </Link>
                        );
                    }

                    return (
                        <a
                            key={item.title}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block no-underline"
                        >
                            <TuiPanel
                                decorativeHeader
                                title={panelTitle}
                                meta="external"
                                interactive
                                className="h-full"
                            >
                                <WorkCardContent item={item} />
                            </TuiPanel>
                        </a>
                    );
                })}
            </div>
        </article>
    );
}
