import Link from "next/link";
import { notFound } from "next/navigation";
import { TuiBadge, TuiPanel } from "@/app/_common/tui";

type ArticleCardProps = {
    slug: string,
    title: string
    tags: Array<string>
    caption?: string,
    published_at?: string,
    emoji?: string | null
    borderRadius?: number
}

function convertToDateString(date: Date) {
    const [y, mo, d] = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    const [h, min] = [date.getHours(), date.getMinutes()]
    return `${y}-${mo.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')} ${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
    slug = "",
    title = "",
    caption = "",
    published_at = "",
    tags = [],
    emoji = null,
}) => {
    if (!slug) {
        notFound()
    }

    const date = new Date(published_at);
    const validDate = !Number.isNaN(date.getTime());
    const formattedDate = validDate ? convertToDateString(date) : published_at;

    return (
        <article className="h-full">
            <Link
                href={`/articles/${slug}`}
                className="block h-full no-underline rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
            >
                <TuiPanel
                    decorativeHeader
                    title={`${slug}.md`}
                    meta="md"
                    interactive
                    className="flex h-full flex-col"
                    bodyClassName="flex flex-1 flex-col gap-3 p-4 sm:p-5"
                >
                    <div className="flex w-full items-start gap-3.5">
                        <span
                            className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xs border border-slate-800 bg-slate-950/70 text-3xl leading-none"
                            aria-hidden="true"
                        >
                            {emoji ?? "📝"}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col">
                            <h2 className="m-0 overflow-hidden text-base font-bold leading-snug text-slate-50 transition-colors group-hover:text-teal-200 line-clamp-2 sm:text-lg">
                                {title}
                            </h2>

                            <p className="mt-1.5 mb-0 min-h-10 text-xs leading-relaxed text-slate-300 line-clamp-3 sm:text-sm">
                                {caption || ""}
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-2.5 border-t border-slate-800/80 pt-3">
                        {tags.length ? (
                            <div className="flex w-full flex-wrap gap-1.5">
                                {tags.slice(0, 3).map((tag) => (
                                    <TuiBadge key={`${slug}-${tag}`} tone="cyan" prefix="#">
                                        {tag}
                                    </TuiBadge>
                                ))}
                                {tags.length > 3 ? (
                                    <TuiBadge tone="neutral">
                                        +{tags.length - 3}
                                    </TuiBadge>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                            <time
                                dateTime={validDate ? date.toISOString() : published_at}
                            >
                                {formattedDate}
                            </time>
                            <span aria-hidden="true" className="text-slate-500 transition-colors group-hover:text-teal-300">
                                [read -&gt;]
                            </span>
                        </div>
                    </div>
                </TuiPanel>
            </Link>
        </article>
    )
}
