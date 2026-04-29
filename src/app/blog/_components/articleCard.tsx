import React from "react";
import { notFound } from "next/navigation";

type ArticleCardProps = {
    slug: string,
    title: string
    tags: Array<string>
    caption?: string,
    published_at?: string,
    emoji?: string | null
    width?: number
    height?: number
    background?: string
    borderRadius?: number
}

function convertToDateString(date: Date){
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
    width = 350,
    height = 100,
    background = "white",
    borderRadius = 8 }) => {
    if (!slug) {
        notFound()
    }
    
    // background が Kuma UI の色名（例: "#87ede5"）などの場合、インラインスタイルで対応
    // borderRadius も数値で渡されるためインラインスタイルで対応

    return (
        <div
            className="z-[8] flex h-full flex-col gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/40 px-4 py-2 no-underline transition duration-200 hover:-translate-y-0.5 hover:border-slate-500/80 hover:shadow-lg hover:shadow-slate-950/40"
            style={{
                borderRadius: `${borderRadius}px`
            }}
        >
            <div className="flex w-full items-start gap-3">
                <img
                    className="h-16 w-16 shrink-0"
                    src={`https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.4/2/svg/${(emoji ?? "📝").codePointAt(0)?.toString(16)}.svg`}
                    alt={emoji ?? ''}
                />
                <div className="flex min-w-0 flex-1 flex-col p-1">
                    <h5 className="m-0 overflow-hidden text-base font-bold text-white no-underline line-clamp-2">
                        {title}
                    </h5>

                    <p className="mt-1 mb-0 min-h-10 text-xs text-slate-400 line-clamp-3">
                        {caption || ''}
                    </p>

                </div>
            </div>

            {tags.length ? (
                <div className="mt-2 flex w-full min-h-6 flex-wrap gap-1.5">
                    {tags.slice(0, 3).map((tag) => (
                        <span
                            key={`${slug}-${tag}`}
                            className="inline-flex items-center shrink-0 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-200"
                        >
                            #{tag}
                        </span>
                    ))}
                    {tags.length > 3 ? (
                        <span className="inline-flex items-center shrink-0 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-200">
                            +{tags.length - 3}
                        </span>
                    ) : null}
                </div>
            ) : (
                <div className="mt-2 w-full min-h-6" />
            )}
            {
                (() => {
                    let date = new Date(published_at);
                    return (
                        <p className="mt-auto mb-0 p-0 text-sm text-slate-300 no-underline">
                            {convertToDateString(date)}
                        </p>
                    )
                })()
            }
        </div>
    )
}
