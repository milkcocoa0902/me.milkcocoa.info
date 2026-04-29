import Image from "next/image";
import {Metadata} from "next";
import {workCount, workItems} from "@/lib/works";

export const metadata: Metadata = {
    title: "Works",
};

export default function WorksPage() {
    const chipBaseClass = "inline-flex rounded-full px-3 py-1 text-sm font-medium";
    const cardBaseClass = "rounded-2xl border border-slate-700/70 bg-slate-900/40 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-500/80 hover:shadow-lg hover:shadow-slate-950/40";
    const works = workItems(workCount(), 0);

    return (
        <div className="my-4 rounded-2xl p-4 text-white">
            <h1 className="border-b border-slate-600/80 pb-2 text-4xl font-bold">Works</h1>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {works.map((item) => (
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
        </div>
    );
}