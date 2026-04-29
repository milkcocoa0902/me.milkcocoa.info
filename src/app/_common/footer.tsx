import { FaXTwitter, FaGithub } from 'react-icons/fa6'
import { SiZenn } from 'react-icons/si'
import { IconType } from "react-icons";
import React from "react";
import {randomUUID} from "node:crypto";

type SocialLink = {
    id: string
    url: string
    icon: IconType
}

const socialLinks: SocialLink[] = [
    {
        id: randomUUID().toString(),
        url: "https://github.com/milkcocoa0902",
        icon: FaGithub
    },
    {
        id: randomUUID().toString(),
        url: "https://twitter.com/milkcocoa0902",
        icon: FaXTwitter
    },
    {
        id: randomUUID().toString(),
        url: "https://zenn.dev/milkcocoa0902",
        icon: SiZenn
    },
]

export const Footer: React.FC = () => {
    return (
        <div className="flex flex-col text-white bg-[#020e1f] sticky top-[100vh] p-[8px_16px]">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                {
                    socialLinks.map((sl: SocialLink) => {
                        return (
                            <a className="m-[4px_16px] no-underline" href={ sl.url } target="_blank" key={sl.id} rel="noopener noreferrer">
                                <sl.icon size={"32"} color={"white"}/>
                            </a>
                        )
                    })
                }
            </div>
            <div className="text-center md:text-end">
                <div>&copy; 2019 - {new Date().getFullYear()} ここあ</div>
            </div>
        </div>
    )
}
