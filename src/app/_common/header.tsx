"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

type Menu = {
    index: number
    text: string
    to: string
    matches: (pathname: string) => boolean
}

const menuItems: Menu[] = [
    {
        index: 0,
        text: "About",
        to: "/",
        matches: (pathname) => pathname === "/",
    },
    {
        index: 1,
        text: "Articles",
        to: "/articles/p/1",
        matches: (pathname) => pathname.startsWith("/articles"),
    },
    {
        index: 2,
        text: "Works",
        to: "/works",
        matches: (pathname) => pathname.startsWith("/works"),
    },
    {
        index: 3,
        text: "GPG Key",
        to: "/gpg",
        matches: (pathname) => pathname.startsWith("/gpg"),
    },
]

export function Header() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-[1000] border-b border-slate-800 bg-[#020e1f]/95 backdrop-blur">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-2 sm:px-4 lg:px-6">
                <div
                    aria-hidden="true"
                    className="hidden items-center gap-2 font-mono text-xs text-slate-400 md:flex shrink-0"
                >
                    <span className="inline-block h-2 w-2 rounded-full bg-teal-400/80" />
                    <span className="text-slate-300">me.milkcocoa.info</span>
                </div>
                <nav aria-label="メインナビゲーション" className="w-full overflow-x-auto md:w-auto">
                    <ul className="flex w-max min-w-full items-center justify-start gap-1 py-1.5 sm:gap-1.5 md:min-w-0">
                        {menuItems.map((menu) => {
                            const isActive = menu.matches(pathname);
                            return (
                                <li key={menu.to}>
                                    <Link
                                        href={menu.to}
                                        aria-current={isActive ? "page" : undefined}
                                        className="group flex min-h-10 items-center whitespace-nowrap rounded-xs border border-transparent px-2.5 py-1 font-mono text-sm font-semibold text-slate-300 no-underline transition-colors hover:border-slate-700 hover:bg-slate-900/90 hover:text-teal-200 aria-[current=page]:border-teal-400/60 aria-[current=page]:bg-teal-950/50 aria-[current=page]:text-teal-200 sm:px-3.5 sm:text-base"
                                    >
                                        <span aria-hidden="true" className="text-slate-500 group-aria-[current=page]:text-teal-400">
                                            [
                                        </span>
                                        <span aria-hidden="true" className="text-xs text-cyan-400/90 mr-0.5">
                                            {menu.index}:
                                        </span>
                                        <span>{menu.text}</span>
                                        <span aria-hidden="true" className="text-slate-500 group-aria-[current=page]:text-teal-400">
                                            ]
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </header>
    );
}
