import Link from "next/link";

export default function PageNavigation(
    props: {
        current: number,
        isLastPage: boolean,
    }
) {
    const buttonBaseClass = "inline-flex items-center rounded-2xl border px-4 py-1.5 text-sm font-semibold no-underline transition duration-200";
    const enabledClass = "cursor-pointer border-slate-700/70 bg-slate-900/40 text-teal-300 hover:-translate-y-0.5 hover:border-slate-500/80 hover:text-teal-200 hover:shadow-lg hover:shadow-slate-950/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300";
    const disabledClass = "cursor-not-allowed border-slate-700/60 bg-slate-800/50 text-slate-500";

    return (
        <nav aria-label="記事一覧のページ送り">
            <div className="my-2 flex flex-row items-center justify-center gap-4 sm:gap-6">
                {props.current === 1 ? (
                    <span aria-disabled="true" className={`${buttonBaseClass} ${disabledClass}`}>&lt; 前のページ</span>
                ) : (
                    <Link href={`/articles/p/${props.current - 1}`} rel="prev" className={`${buttonBaseClass} ${enabledClass}`}>
                        &lt; 前のページ
                    </Link>
                )}
                {props.isLastPage ? (
                    <span aria-disabled="true" className={`${buttonBaseClass} ${disabledClass}`}>次のページ &gt;</span>
                ) : (
                    <Link href={`/articles/p/${props.current + 1}`} rel="next" className={`${buttonBaseClass} ${enabledClass}`}>
                        次のページ &gt;
                    </Link>
                )}
            </div>
        </nav>
    )
}
