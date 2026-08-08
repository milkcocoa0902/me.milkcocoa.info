import type {Metadata} from "next";
import {BusinessCard} from "./business-card";

export const metadata: Metadata = {
    title: "Business Card",
    description: "milkcocoa / Cocoa Tech. Lab. のデジタル名刺",
    alternates: {
        canonical: "/bc",
    },
    openGraph: {
        title: "Business Card",
        description: "milkcocoa / Cocoa Tech. Lab. のデジタル名刺",
        url: "/bc",
    },
    twitter: {
        card: "summary",
        title: "Business Card",
        description: "milkcocoa / Cocoa Tech. Lab. のデジタル名刺",
    },
};

type BusinessCardPageProps = {
    searchParams: Promise<{
        date?: string | string[];
    }>;
};

function parsePresentedDate(value: string | string[] | undefined) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return undefined;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return undefined;
    }

    return new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    }).format(date);
}

export default async function BusinessCardPage({searchParams}: BusinessCardPageProps) {
    const {date} = await searchParams;

    return <BusinessCard presentedDate={parsePresentedDate(date)}/>;
}
