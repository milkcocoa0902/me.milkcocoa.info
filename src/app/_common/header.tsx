import React from "react";
import {randomUUID} from "node:crypto";

type Menu = {
    id: string,
    text: string,
    to: string
}

const socialLinks: Menu[] = [
    {
        id: randomUUID().toString(),
        text: "About",
        to: "/"
    },
    {
        id: randomUUID().toString(),
        text: "Articles",
        to: "/blog/p/1"
    },
    {
        id: randomUUID().toString(),
        text: "Works",
        to: "/works"
    },
    {
        id: randomUUID().toString(),
        text: "GPG Key",
        to: "/gpg"
    },
]

export const Header: React.FC = () => {
    return (
        <div className="z-[1000] flex flex-row items-center bg-[#020e1f] sticky top-0 p-[8px_16px] justify-around md:justify-start">
            {
                socialLinks.map((menu: Menu) => {
                    return (
                        <div
                            className="p-[0px_16px]"
                            key={menu.id}
                        >
                            <a href={menu.to} className="no-underline">
                                <h2 className="text-white text-xl font-bold">{menu.text}</h2>
                            </a>
                        </div>
                    )
                })
            }
        </div>
    )
}
