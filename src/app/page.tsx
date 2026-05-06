import Image, {StaticImageData} from "next/image";
import Link from "next/link";
import {workItems} from "@/lib/works";
import { FaBuilding, FaLocationDot, FaUserTie } from "react-icons/fa6";

type TechStack = {
    category: string
    language: string[]
    framework: string[]
    middleware: string[]
    infra?: string[]
}

type TechCategoryChipTone = "language" | "framework" | "library" | "tools" | "infra" | "service"


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



export default function Home() {
    const chipBaseClass = 'inline-flex rounded-full px-3 py-1 text-sm font-medium'
    const cardBaseClass = 'rounded-2xl border border-slate-700/70 bg-slate-900/40 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-500/80 hover:shadow-lg hover:shadow-slate-950/40'
    const chipTone = {
        language: 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-200',
        framework: 'border border-sky-400/40 bg-sky-500/20 text-sky-200',
        library: 'border border-violet-400/40 bg-violet-500/20 text-violet-200',
        tools: 'border border-fuchsia-400/40 bg-fuchsia-500/20 text-fuchsia-200',
        infra: 'border border-amber-400/40 bg-amber-500/20 text-amber-200',
        service: 'border border-orange-400/40 bg-orange-500/20 text-orange-200'
    }


    return (
        <div className="text-white p-4 my-4 rounded-2xl">
            <div className={"pb-4"}>
                <div>
                {/*  profile image  */}
                </div>
                <div>
                    <h1 className="text-4xl font-bold">milkcocoa</h1>
                    <h1 className="flex items-center gap-2 text-lg font-bold">
                        <FaBuilding className="text-slate-300" aria-hidden="true" />
                        <span>Cocoa Tech. Lab.</span>
                    </h1>
                    <h2 className="flex items-center gap-2 text-lg text-teal-500">
                        <FaUserTie className="text-teal-400" aria-hidden="true" />
                        <span>Kotlin Backend Engineer</span>
                    </h2>

                    <p className="text-md flex items-center gap-2">
                        <FaLocationDot className="text-slate-300" aria-hidden="true" />
                        <span>Osaka, Japan</span>
                    </p>
                    <p className="text-md">

                    </p>
                </div>
            </div>
            <div className={"py-4"}>
                <h1 className="border-b border-slate-600/80 pb-2 text-4xl font-bold">Tech. Stack</h1>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {TechStackItems.map((stack) => (
                        <section
                            key={stack.title}
                            className={cardBaseClass}
                        >
                            <h2 className="text-xl font-semibold text-teal-300">{stack.title}</h2>

                            <div className="mt-3 space-y-3">
                                {
                                    stack.groups.map((tech) => (
                                        <div key={`${stack.title}-${tech.label}`}>
                                            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                                                {tech.label}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {tech.items.map((i) => (
                                                    <span
                                                        key={`${stack.title}-${tech.label}-${i.name}`}
                                                        className={`${chipBaseClass} ${chipTone[i.tone]}`}
                                                    >
                                                {i.name}
                                            </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </section>
                    ))}
                </div>
            </div>

            <div className={"py-4"}>
                <h1 className="border-b border-slate-600/80 pb-2 text-4xl font-bold">Works</h1>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {workItems(4, 0).map((item) => (
                        item.href ? (
                            <a
                                key={item.title}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${cardBaseClass} block`}
                            >
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    className="h-48 w-full rounded-xl object-cover"
                                />

                                <h2 className="mt-4 text-xl font-semibold text-teal-300">{item.title}</h2>
                                <p className="mt-2 text-slate-200">{item.description}</p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {item.stack.map((tech) => (
                                        <span
                                            key={`${item.title}-${tech}`}
                                            className={`${chipBaseClass} border border-cyan-400/40 bg-cyan-500/20 text-cyan-200`}
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </a>
                        ) : (
                            <section
                                key={item.title}
                                className={cardBaseClass}
                            >
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    className="h-48 w-full rounded-xl object-cover"
                                />

                                <h2 className="mt-4 text-xl font-semibold text-teal-300">{item.title}</h2>
                                <p className="mt-2 text-slate-200">{item.description}</p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {item.stack.map((tech) => (
                                        <span
                                            key={`${item.title}-${tech}`}
                                            className={`${chipBaseClass} border border-cyan-400/40 bg-cyan-500/20 text-cyan-200`}
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )
                    ))}
                </div>
                <div className="mt-4 flex justify-end">
                    <Link
                        href="/works"
                        className="inline-flex items-center rounded-xl border border-slate-700/70 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-teal-300 transition duration-200 hover:-translate-y-0.5 hover:border-slate-500/80 hover:text-teal-200 hover:shadow-lg hover:shadow-slate-950/40"
                    >
                        View All &gt;&gt;
                    </Link>
                </div>
            </div>
        </div>
    );
};