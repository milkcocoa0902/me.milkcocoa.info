"use client";

import React from "react";

export default function PageNavigation(
    props: {
        current: number,
        isLastPage: boolean,
    }
) {
    const buttonBaseClass = "inline-flex items-center rounded-2xl border px-4 py-1.5 text-sm font-semibold no-underline transition duration-200";

    return (
        <React.Fragment>
            <div className="my-2 flex flex-row items-center justify-center gap-4 sm:gap-6">
                <a
                    href={(props.current === 1) ? undefined : `/blog/p/${props.current - 1}`}
                    aria-disabled={props.current === 1}
                    className={`${buttonBaseClass} ${
                        props.current === 1
                            ? "cursor-not-allowed border-slate-700/60 bg-slate-800/50 text-slate-500"
                            : "cursor-pointer border-slate-700/70 bg-slate-900/40 text-teal-300 hover:-translate-y-0.5 hover:border-slate-500/80 hover:text-teal-200 hover:shadow-lg hover:shadow-slate-950/40"
                    }`}
                >
                    &lt; 前のページ
                </a>
                <a
                    href={props.isLastPage ? undefined : `/blog/p/${props.current + 1}`}
                    aria-disabled={props.isLastPage}
                    className={`${buttonBaseClass} ${
                        props.isLastPage
                            ? "cursor-not-allowed border-slate-700/60 bg-slate-800/50 text-slate-500"
                            : "cursor-pointer border-slate-700/70 bg-slate-900/40 text-teal-300 hover:-translate-y-0.5 hover:border-slate-500/80 hover:text-teal-200 hover:shadow-lg hover:shadow-slate-950/40"
                    }`}
                >
                    次のページ &gt;
                </a>
            </div>
        </React.Fragment>
    )
}