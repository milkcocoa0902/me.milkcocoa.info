import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {workItems, type Work} from "@/lib/works";
import { FaBuilding, FaLocationDot, FaUserTie } from "react-icons/fa6";
import { CommandPrompt, TuiBadge, TuiPanel, type TuiBadgeTone } from "@/app/_common/tui";

const description = "Kotlin・Android・バックエンド開発を中心に、技術記事と個人開発プロダクトを公開するmilkcocoaのポートフォリオ。";

export const metadata: Metadata = {
    title: {
        absolute: "ここあさんの倉庫",
    },
    description,
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "ここあさんの倉庫",
        description,
        url: "/",
        type: "website",
        locale: "ja_JP",
    },
    twitter: {
        card: "summary_large_image",
        title: "ここあさんの倉庫",
        description,
        creator: "@milkcocoa0902",
    },
};

type TechCategoryChipTone = Extract<
    TuiBadgeTone,
    "language" | "framework" | "library" | "tools" | "infra" | "service"
>;


type TechCategory = {
    title: string
    groups: {
        label: "Language" | "Framework" | "Libraries / Tools" | "Infrastructure / Services"
        items: {
            name: string
            tone: TechCategoryChipTone
        }[]
    }[]
}

const TechStackItems: TechCategory[] = [
    {
        title: 'ServerSide Application Development',
        groups: [
            {
                label: "Language",
                items: [
                    { name: "Kotlin", tone: "language" },
                    { name: "Python", tone: "language" }
                ]
            },
            {
                label: "Framework",
                items: [
                    { name: "Ktor", tone: "framework" },
                    { name: "Django", tone: "framework" },
                    { name: "FastAPI", tone: "framework" }
                ]
            },
            {
                label: "Libraries / Tools",
                items: [
                    { name: "Exposed", tone: "library" },
                    { name: "Koin", tone: "library" },
                    { name: "Flyway", tone: "tools"},
                    { name: "Pydantic", tone: "library" },
                    { name: "kotlinx.serialization", tone: "library" },
                    { name: "kotlin.test", tone: "tools" }
                ]
            },
            {
                label: "Infrastructure / Services",
                items: [
                    { name: "ECS", tone: "infra" },
                    { name: "Fargate", tone: "infra" },
                    { name: "ALB", tone: "infra" },
                    { name: "RDS", tone: "infra" },
                ]
            }
        ]
    },
    {
        title: 'Mobile Application Development',
        groups: [
            {
                label: "Language",
                items: [
                    { name: "Kotlin", tone: "language" }
                ]
            },
            {
                label: "Framework",
                items: [
                    { name: "Android SDK", tone: "framework" },
                    { name: "Jetpack", tone: "framework" },
                    { name: "Android View", tone: "framework" }
                ]
            },
            {
                label: "Libraries / Tools",
                items: [
                    { name: "Hilt", tone: "library" },
                    { name: "Room", tone: "library" },
                    { name: "DataStore", tone: "library" },
                    { name: "Ktor", tone: "library" },
                    { name: "Coroutines", tone: "library" }
                ]
            },
            {
                label: "Infrastructure / Services",
                items: [
                    { name: "Firebase", tone: "infra" }
                ]
            }
        ]
    },
    {
        title: "Web Front Development",
        groups: [
            {
                label: "Language",
                items: [
                    { name: "JavaScript", tone: "language" },
                    { name: "TypeScript", tone: "language" }
                ]
            },
            {
                label: "Framework",
                items: [
                    { name: "React", tone: "framework" },
                    { name: "Next.js", tone: "framework" }
                ]
            },
            {
                label: "Libraries / Tools",
                items: [
                    { name: "Zod", tone: "library" },
                    { name: "Axios", tone: "library" },
                ]
            },
            {
                label: "Infrastructure / Services",
                items: [
                    { name: "S3", tone: "infra" },
                    { name: "CloudFront", tone: "infra" },
                    { name: "Cloudflare", tone: "service" },
                    { name: "Node.js", tone: "infra" }
                ]
            }
        ]
    }
]



function WorkExcerptCardContent({ item }: { item: Work }) {
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
                <h3 className="font-mono text-lg font-bold text-teal-300 group-hover:text-teal-200 sm:text-xl">
                    {item.title}
                </h3>
                {item.href && (
                    <span
                        aria-hidden="true"
                        className="font-mono text-xs text-slate-400 transition-colors group-hover:text-teal-300"
                    >
                        {item.href.startsWith("/") ? "[open ->]" : "[ext ↗]"}
                    </span>
                )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-200 sm:text-base">
                {item.description}
            </p>

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

export default function Home() {
    return (
        <div className="my-6 space-y-10 text-slate-100 sm:my-8">
            <header>
                <CommandPrompt
                    command="whoami --verbose"
                    path="~"
                    showCaret
                    as="h1"
                    title="milkcocoa"
                    className="mb-4"
                />
                <TuiPanel decorativeHeader title="profile">
                    <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                        <div className="space-y-4">
                            <dl className="grid gap-2.5 font-mono text-sm sm:grid-cols-3 sm:gap-4">
                                <div className="rounded-xs border border-slate-800/90 bg-slate-950/50 px-3 py-2">
                                    <dt className="text-xs text-slate-400">org</dt>
                                    <dd className="mt-1 flex items-center gap-2 font-semibold text-slate-100">
                                        <FaBuilding className="shrink-0 text-slate-400" aria-hidden="true" />
                                        <span>Cocoa Tech. Lab.</span>
                                    </dd>
                                </div>
                                <div className="rounded-xs border border-slate-800/90 bg-slate-950/50 px-3 py-2">
                                    <dt className="text-xs text-slate-400">role</dt>
                                    <dd className="mt-1 flex items-center gap-2 font-semibold text-teal-300">
                                        <FaUserTie className="shrink-0 text-teal-400" aria-hidden="true" />
                                        <span>Kotlin Backend Engineer</span>
                                    </dd>
                                </div>
                                <div className="rounded-xs border border-slate-800/90 bg-slate-950/50 px-3 py-2">
                                    <dt className="text-xs text-slate-400">location</dt>
                                    <dd className="mt-1 flex items-center gap-2 font-semibold text-slate-100">
                                        <FaLocationDot className="shrink-0 text-slate-400" aria-hidden="true" />
                                        <span>Osaka, Japan</span>
                                    </dd>
                                </div>
                            </dl>

                            <div className="max-w-3xl space-y-2">
                                <p className="text-sm leading-7 text-slate-200 sm:text-base">
                                    Kotlin・Android・バックエンド開発を中心に、技術記事と個人開発プロダクトを公開しています。
                                </p>
                                <p lang="en" className="text-sm leading-relaxed text-slate-400">
                                    Crafting backend systems, Android apps, and indie tools with Kotlin — sharing technical notes along the way.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">
                            <Link
                                href="/articles/p/1"
                                className="inline-flex items-center justify-between gap-3 rounded-xs border border-slate-700 bg-slate-950/70 px-3.5 py-2 font-mono text-xs font-semibold text-teal-300 no-underline transition-colors hover:border-teal-400/70 hover:bg-slate-900 hover:text-teal-200"
                            >
                                <span>cd ~/articles</span>
                                <span aria-hidden="true">-&gt;</span>
                            </Link>
                            <Link
                                href="/works"
                                className="inline-flex items-center justify-between gap-3 rounded-xs border border-slate-700 bg-slate-950/70 px-3.5 py-2 font-mono text-xs font-semibold text-cyan-300 no-underline transition-colors hover:border-cyan-400/70 hover:bg-slate-900 hover:text-cyan-200"
                            >
                                <span>cd ~/works</span>
                                <span aria-hidden="true">-&gt;</span>
                            </Link>
                            <Link
                                href="/gpg"
                                className="inline-flex items-center justify-between gap-3 rounded-xs border border-slate-700 bg-slate-950/70 px-3.5 py-2 font-mono text-xs font-semibold text-slate-300 no-underline transition-colors hover:border-teal-400/70 hover:bg-slate-900 hover:text-teal-200"
                            >
                                <span>gpg --list-keys</span>
                                <span aria-hidden="true">-&gt;</span>
                            </Link>
                        </div>
                    </div>
                </TuiPanel>
            </header>

            <section aria-labelledby="tech-stack-heading">
                <CommandPrompt
                    command="cat ~/.config/tech-stack.toml"
                    path="~"
                    as="h2"
                    title="Tech. Stack"
                    id="tech-stack-heading"
                    className="mb-4"
                />
                <div className="grid gap-4 lg:grid-cols-2">
                    {TechStackItems.map((stack, index) => (
                        <section key={stack.title} aria-label={stack.title}>
                            <TuiPanel
                                decorativeHeader
                                title={`stack.${index}`}
                                meta="toml"
                                className="h-full"
                            >
                                <h3 className="font-mono text-lg font-bold text-teal-300 sm:text-xl">
                                    {stack.title}
                                </h3>

                                <div className="mt-4 space-y-3.5">
                                    {stack.groups.map((tech) => (
                                        <div
                                            key={`${stack.title}-${tech.label}`}
                                            className="border-l-2 border-slate-800 pl-3"
                                        >
                                            <h4 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                {tech.label}
                                            </h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {tech.items.map((i) => (
                                                    <TuiBadge
                                                        key={`${stack.title}-${tech.label}-${i.name}`}
                                                        tone={i.tone}
                                                    >
                                                        {i.name}
                                                    </TuiBadge>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TuiPanel>
                        </section>
                    ))}
                </div>
            </section>

            <section aria-labelledby="works-heading">
                <CommandPrompt
                    command="ls -la ~/works | head -n 4"
                    path="~"
                    as="h2"
                    title="Works"
                    id="works-heading"
                    className="mb-4"
                />
                <div className="grid gap-4 lg:grid-cols-2">
                    {workItems(4, 0).map((item, idx) => {
                        const panelTitle = `work.${String(idx).padStart(2, "0")}`;
                        if (!item.href) {
                            return (
                                <section key={item.title} aria-label={item.title}>
                                    <TuiPanel decorativeHeader title={panelTitle} className="h-full">
                                        <WorkExcerptCardContent item={item} />
                                    </TuiPanel>
                                </section>
                            );
                        }

                        const isInternal = item.href.startsWith("/");
                        if (isInternal) {
                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className="block no-underline"
                                >
                                    <TuiPanel
                                        decorativeHeader
                                        title={panelTitle}
                                        meta="local"
                                        interactive
                                        className="h-full"
                                    >
                                        <WorkExcerptCardContent item={item} />
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
                                    <WorkExcerptCardContent item={item} />
                                </TuiPanel>
                            </a>
                        );
                    })}
                </div>
                <div className="mt-5 flex justify-end">
                    <Link
                        href="/works"
                        className="inline-flex items-center gap-2 rounded-xs border border-slate-700 bg-slate-900/70 px-4 py-2 font-mono text-sm font-semibold text-teal-300 no-underline transition-colors hover:border-teal-400/70 hover:bg-slate-900 hover:text-teal-200"
                    >
                        <span aria-hidden="true">[</span>
                        <span>View All</span>
                        <span aria-hidden="true">-&gt;]</span>
                    </Link>
                </div>
            </section>
        </div>
    );
}
