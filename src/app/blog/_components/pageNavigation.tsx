"use client";

import React from "react";

export default function PageNavigation(
    props: {
        current: number,
        isLastPage: boolean,
    }
) {
    return (
        <React.Fragment>
            <div className="flex flex-row justify-center items-center my-2 gap-16">
                <a
                    href={(props.current === 1) ? undefined : `/blog/p/${props.current - 1}`}
                    aria-disabled={props.current === 1}
                    className={`no-underline ${props.current === 1 ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                    <div
                        className={`rounded-2xl border-solid border px-4 py-0.5 text-[#333333] ${
                            props.current === 1 
                            ? "bg-slate-400 border-slate-400" 
                            : "bg-[#EAEAEA] border-blue-900"
                        }`}
                    >
                        &lt; 前のページ
                    </div>
                </a>
                <a
                    href={props.isLastPage ? undefined : `/blog/p/${props.current + 1}`}
                    aria-disabled={props.isLastPage}
                    className={`no-underline ${props.isLastPage ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                    <div
                        className={`rounded-2xl border-solid border px-4 py-0.5 text-[#333333] ${
                            props.isLastPage 
                            ? "bg-slate-400 border-slate-400" 
                            : "bg-[#EAEAEA] border-blue-900"
                        }`}
                    >
                        次のページ &gt;
                    </div>
                </a>
            </div>
        </React.Fragment>
    )
}