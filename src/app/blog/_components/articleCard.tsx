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
    const [y, mo, d] = [date.getFullYear(), date.getMonth() + 1, date.getDay()]
    const [h, min, s] = [date.getHours(), date.getMinutes(), date.getSeconds()]
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
            className="flex items-center gap-2 p-2 bg-white shadow-[4px_4px_2px_1px_rgba(0,0,0,0.2)] z-[8] no-underline"
            style={{ 
                width: width ? `${width}px` : "350px",
                borderRadius: `${borderRadius}px`
            }}
        >
            <div
                className="flex items-center justify-center shrink-0 w-20 h-24 m-0"
                style={{ 
                    backgroundColor: background,
                    borderRadius: `${borderRadius}px`
                }}
            >
                <img
                    className="m-auto text-center w-16 h-16"
                    src={`https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.4/2/svg/${(emoji ?? "📝").codePointAt(0)?.toString(16)}.svg`}
                    alt={emoji ?? ''}
                    style={{ backgroundColor: background }}
                />
            </div>
            <div className="flex flex-col p-1 w-[calc(100%-80px)]">
                <h4 className="m-0 text-base font-bold no-underline text-black">
                    {title}
                </h4>

                {
                    (() => {
                        let date = new Date(published_at);
                        return (
                            <p className="my-1 p-0 text-sm no-underline text-gray-600">
                                {convertToDateString(date)}
                            </p>
                        )
                    })()
                }
            </div>
        </div>
    )
}
