import Link from "next/link";

export default function PageNavigation(
    props: {
        current: number,
        isLastPage: boolean,
    }
) {
    const buttonBaseClass = "inline-flex items-center gap-1.5 rounded-xs border px-3.5 py-2 font-mono text-xs sm:text-sm font-semibold no-underline transition-colors duration-150";
    const enabledClass = "cursor-pointer border-slate-700 bg-slate-900/70 text-teal-300 hover:border-teal-400/70 hover:bg-slate-900 hover:text-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300";
    const disabledClass = "cursor-not-allowed border-slate-800 bg-slate-950/40 text-slate-600";

    return (
        <nav aria-label="記事一覧のページ送り">
            <div className="my-2 flex flex-row items-center justify-center gap-3 sm:gap-5">
                {props.current === 1 ? (
                    <span aria-disabled="true" className={`${buttonBaseClass} ${disabledClass}`}>
                        <span aria-hidden="true">[ &lt;</span>
                        <span>前のページ</span>
                        <span aria-hidden="true">]</span>
                    </span>
                ) : (
                    <Link href={`/articles/p/${props.current - 1}`} rel="prev" className={`${buttonBaseClass} ${enabledClass}`}>
                        <span aria-hidden="true">[ &lt;</span>
                        <span>前のページ</span>
                        <span aria-hidden="true">]</span>
                    </Link>
                )}

                <span className="font-mono text-xs text-slate-400">
                    page:{props.current}
                </span>

                {props.isLastPage ? (
                    <span aria-disabled="true" className={`${buttonBaseClass} ${disabledClass}`}>
                        <span aria-hidden="true">[</span>
                        <span>次のページ</span>
                        <span aria-hidden="true">&gt; ]</span>
                    </span>
                ) : (
                    <Link href={`/articles/p/${props.current + 1}`} rel="next" className={`${buttonBaseClass} ${enabledClass}`}>
                        <span aria-hidden="true">[</span>
                        <span>次のページ</span>
                        <span aria-hidden="true">&gt; ]</span>
                    </Link>
                )}
            </div>
        </nav>
    )
}
