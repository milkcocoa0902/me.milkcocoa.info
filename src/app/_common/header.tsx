"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

type Menu = {
    text: string
    to: string
    matches: (pathname: string) => boolean
}

const menuItems: Menu[] = [
    {
        text: "About",
        to: "/",
        matches: (pathname) => pathname === "/",
    },
    {
        text: "Articles",
        to: "/articles/p/1",
        matches: (pathname) => pathname.startsWith("/articles"),
    },
    {
        text: "Works",
        to: "/works",
        matches: (pathname) => pathname.startsWith("/works"),
    },
    {
        text: "GPG Key",
        to: "/gpg",
        matches: (pathname) => pathname.startsWith("/gpg"),
    },
]

export function Header() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-[1000] bg-[#020e1f]/95 shadow-sm shadow-slate-950/30 backdrop-blur">
            <nav aria-label="メインナビゲーション" className="overflow-x-auto px-2 sm:px-4">
                <ul className="mx-auto flex w-max min-w-full items-center justify-center sm:justify-start">
                    {menuItems.map((menu) => (
                        <li key={menu.to}>
                            <Link
                                href={menu.to}
                                aria-current={menu.matches(pathname) ? "page" : undefined}
                                className="flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-base font-bold text-white no-underline transition-colors hover:bg-slate-800 hover:text-teal-200 aria-[current=page]:text-teal-300 sm:px-4 sm:text-xl"
                            >
                                {menu.text}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </header>
    );
}
