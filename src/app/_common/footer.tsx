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
        <footer className="mt-auto border-t border-slate-800 bg-[#020e1f] text-slate-200">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-6">
                <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs sm:justify-start">
                    <nav aria-label="ソーシャルリンク">
                        <ul className="flex items-center gap-1.5">
                            {socialLinks.map((socialLink) => (
                                <li key={socialLink.url}>
                                    <a
                                        className="inline-flex min-h-9 items-center gap-1.5 rounded-xs border border-slate-800 bg-slate-900/70 px-2.5 py-1 font-mono text-xs text-slate-200 no-underline transition-colors hover:border-teal-400/60 hover:bg-slate-800 hover:text-teal-200"
                                        href={socialLink.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`${socialLink.label}（新しいタブで開く）`}
                                    >
                                        <socialLink.icon size={15} aria-hidden="true" />
                                        <span>{socialLink.label}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div className="flex items-center justify-center gap-3 font-mono text-xs text-slate-400 sm:justify-end">
                    <p className="m-0 text-slate-300">
                        &copy; 2019 - {new Date().getFullYear()} ここあ (milkcocoa0902)
                    </p>
                </div>
            </div>
        </footer>
    );
}
