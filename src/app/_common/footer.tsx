import {FaGithub, FaXTwitter} from "react-icons/fa6";
import {SiZenn} from "react-icons/si";
import type {IconType} from "react-icons";

type SocialLink = {
    label: string
    url: string
    icon: IconType
}

const socialLinks: SocialLink[] = [
    {
        label: "GitHub",
        url: "https://github.com/milkcocoa0902",
        icon: FaGithub,
    },
    {
        label: "X",
        url: "https://twitter.com/milkcocoa0902",
        icon: FaXTwitter,
    },
    {
        label: "Zenn",
        url: "https://zenn.dev/milkcocoa0902",
        icon: SiZenn,
    },
]

export function Footer() {
    return (
        <footer className="mt-auto flex flex-col bg-[#020e1f] p-4 text-white">
            <nav aria-label="ソーシャルリンク">
                <ul className="flex justify-center gap-3">
                    {socialLinks.map((socialLink) => (
                        <li key={socialLink.url}>
                            <a
                                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-white no-underline transition-colors hover:bg-slate-800 hover:text-teal-200"
                                href={socialLink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${socialLink.label}（新しいタブで開く）`}
                            >
                                <socialLink.icon size={32} aria-hidden="true" />
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <p className="mt-2 text-center text-sm text-slate-200 md:text-end">
                &copy; 2019 - {new Date().getFullYear()} ここあ (milkcocoa0902)
            </p>
        </footer>
    );
}
