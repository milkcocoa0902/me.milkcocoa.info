import type {Metadata} from "next";
import {CommandPrompt, TuiPanel} from "@/app/_common/tui";
import {ContactForm} from "./_components/ContactForm";

export const metadata: Metadata = {
    title: "お問い合わせ",
    description: "個人事業に関するソフトウェア開発・技術相談・執筆・登壇・協業のご相談窓口です。",
    alternates: {canonical: "/contact"},
};

export default function ContactPage() {
    return <div className="mx-auto my-6 max-w-3xl space-y-6 text-slate-100 sm:my-8">
        <CommandPrompt command="contact --business" path="~" as="h1" title="お問い合わせ" showCaret />
        <p className="leading-8 text-slate-300">個人事業として、ソフトウェア開発や技術相談、執筆・登壇・協業などのご相談を受け付けています。</p>
        <TuiPanel decorativeHeader title="business.contact">
            <ContactForm siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()} />
        </TuiPanel>
    </div>;
}
