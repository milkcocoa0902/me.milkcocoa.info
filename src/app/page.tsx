import Image, {StaticImageData} from "next/image";
import Link from "next/link";
import {workItems} from "@/lib/works";

type TechStack = {
    category: string
    language: string[]
    framework: string[]
    middleware: string[]
    infra?: string[]
}

const TechStackItems: TechStack[] = [
    {
        category: 'ServerSide Application Development',
        language: ['Kotlin', 'Python'],
        framework: ['Ktor', 'Django', 'FastAPI'],
        middleware: ['Exposed', 'Koin', 'Flyway', 'Pydantic'],
        infra: ['ECS', 'Fargate', 'ALB', 'RDS', 'Other AWS Resources...']
    },
    {
        category: 'Mobile Application Development',
        language: ['Kotlin'],
        framework: ['Android SDK', 'Jetpack', 'Android View'],
        middleware: ['Hilt', 'Room', 'DataStore', 'Ktor', 'Coroutines'],
        infra: ['Firebase']
    },
    {
        category: 'Web Front Development',
        language: ['JavaScript', 'TypeScript'],
        framework: ['React', 'Next.js'],
        middleware: ['Zod'],
        infra: ['S3', 'CloudFront', 'Cloudflare', 'Node.js']
    }
]



export default function Home() {
    const chipBaseClass = 'inline-flex rounded-full px-3 py-1 text-sm font-medium'
    const cardBaseClass = 'rounded-2xl border border-slate-700/70 bg-slate-900/40 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-500/80 hover:shadow-lg hover:shadow-slate-950/40'

    return (
        <div className="text-white p-4 my-4 rounded-2xl">
            <div className={"pb-4"}>
                <div>
                {/*  profile image  */}
                </div>
                <div>
                    <h1 className="text-4xl font-bold">milkcocoa (Cocoa Tech. Lab.)</h1>
                    <h2 className="text-lg text-teal-500">Kotlin Backend Engineer</h2>

                    <p className="text-md">Osaka, Japan</p>
                    <p className="text-md">

                    </p>
                </div>
            </div>
            <div className={"py-4"}>
                <h1 className="border-b border-slate-600/80 pb-2 text-4xl font-bold">Tech. Stack</h1>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {TechStackItems.map((item) => (
                        <section
                            key={item.category}
                            className={cardBaseClass}
                        >
                            <h2 className="text-xl font-semibold text-teal-300">{item.category}</h2>

                            <div className="mt-3 space-y-3">
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                                        Language
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {item.language.map((tech) => (
                                            <span
                                                key={`language-${tech}`}
                                                className={`${chipBaseClass} bg-emerald-500/20 text-emerald-200 border border-emerald-400/40`}
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                                        Framework
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {item.framework.map((tech) => (
                                            <span
                                                key={`framework-${tech}`}
                                                className={`${chipBaseClass} bg-sky-500/20 text-sky-200 border border-sky-400/40`}
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                                        Middleware
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {item.middleware.map((tech) => (
                                            <span
                                                key={`middleware-${tech}`}
                                                className={`${chipBaseClass} bg-violet-500/20 text-violet-200 border border-violet-400/40`}
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {item.infra?.length ? (
                                    <div>
                                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                                            Infrastructure
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {item.infra.map((tech) => (
                                                <span
                                                    key={`infra-${tech}`}
                                                    className={`${chipBaseClass} border border-amber-400/40 bg-amber-500/20 text-amber-200`}
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
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