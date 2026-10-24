import {Metadata} from "next";

import * as openpgp from "openpgp";
import {readFileSync} from "fs";
import {FaKey} from "react-icons/fa";
import { CommandPrompt, TuiPanel } from "@/app/_common/tui";

export async function generateMetadata(): Promise<Metadata> {
    const description = 'milkcocoaの公開GPG鍵、鍵ID、フィンガープリント。';
    return {
        title: 'GPG Key',
        description,
        alternates: {canonical: '/gpg'},
        openGraph: {
            title: 'GPG Key',
            description,
            url: '/gpg',
        },
        twitter: {
            card: 'summary',
            title: 'GPG Key',
            description,
        },
    };
}

function chunk<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
        array.slice(i * size, (i + 1) * size),
    );
};

function scrambleUserId(userId: string): { index: number; c: string }[] {
    return Array.from(userId)
        .map((c, idx) => ({
            index: idx,
            c,
            weight: ((idx * 37 + c.charCodeAt(0) * 13) % 97),
        }))
        .sort((a, b) => a.weight - b.weight || a.index - b.index)
        .map(({ index, c }) => ({ index, c }));
}

export default async function GPGKey() {
    const key = await openpgp.readKey({armoredKey: readFileSync(`${process.cwd()}/milkcocoa0902_public_key.asc`).toString()});
    const keyId = key.getKeyID().toHex().toUpperCase();
    const scrambledUserId = scrambleUserId(key.getUserIDs()[0] ?? "");
    const fingerprint = chunk(Array.from(key.getFingerprint().toUpperCase()), 4)
        .map((c) => c.join(""))
        .reduce((a, b) => `${a} ${b}`, "")
        .trim();

    return (
        <article className="my-6 space-y-6 text-slate-100 sm:my-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CommandPrompt
                    command="gpg --list-keys --with-fingerprint milkcocoa0902"
                    path="~/gpg"
                    showCaret
                    as="h1"
                    title="Public GPG Key"
                />
                <div className="inline-flex w-fit items-center gap-2 rounded-xs border border-teal-400/40 bg-teal-950/40 px-3 py-1.5 font-mono text-xs text-teal-200">
                    <FaKey aria-hidden="true" className="text-teal-300" />
                    <span>PGP PUBLIC KEY BLOCK</span>
                </div>
            </header>

            <div className="grid gap-4 lg:grid-cols-2">
                <section aria-labelledby="gpg-key-id">
                    <TuiPanel title="key_id" meta="hex" className="h-full">
                        <h2 id="gpg-key-id" className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                            鍵ID (Key ID)
                        </h2>
                        <div className="mt-2 rounded-xs border border-slate-800 bg-slate-950/80 px-3.5 py-2.5">
                            <code className="block overflow-x-auto font-mono text-sm font-bold text-teal-300 sm:text-base">
                                {keyId}
                            </code>
                        </div>
                    </TuiPanel>
                </section>

                <section aria-labelledby="gpg-user-id">
                    <TuiPanel title="uid" meta="obfuscated" className="h-full">
                        <h2 id="gpg-user-id" className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                            ユーザID (User ID)
                        </h2>
                        <div className="mt-2 flex flex-row overflow-x-auto rounded-xs border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 font-mono text-sm font-bold text-slate-100 sm:text-base">
                            {scrambledUserId.map((obj) => (
                                <span
                                    className="p-0 whitespace-pre"
                                    style={{order: obj.index, userSelect: "none"}}
                                    key={obj.index}
                                >
                                    {obj.c}
                                </span>
                            ))}
                        </div>
                    </TuiPanel>
                </section>
            </div>

            <section aria-labelledby="gpg-fingerprint">
                <TuiPanel title="fingerprint" meta="sha1/v4">
                    <h2 id="gpg-fingerprint" className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                        指紋 (Fingerprint)
                    </h2>
                    <div className="mt-2 rounded-xs border border-slate-800 bg-slate-950/80 px-3.5 py-2.5">
                        <pre className="m-0 overflow-x-auto p-0 font-mono text-sm font-bold text-cyan-200 sm:text-base" tabIndex={0}>
                            <code>{fingerprint}</code>
                        </pre>
                    </div>
                </TuiPanel>
            </section>

            <section aria-labelledby="gpg-armored-key">
                <CommandPrompt
                    command={`gpg --armor --export ${keyId}`}
                    path="~/gpg"
                    className="mb-3"
                />
                <TuiPanel title="public_key.asc" meta="ascii-armored">
                    <h2 id="gpg-armored-key" className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                        公開鍵 (Armored Public Key)
                    </h2>
                    <div className="mt-2 rounded-xs border border-slate-800 bg-slate-950/90 p-3.5">
                        <pre
                            className="m-0 max-h-[32rem] overflow-auto whitespace-pre-wrap break-all p-0 font-mono text-xs leading-relaxed text-slate-200 sm:text-sm"
                            tabIndex={0}
                        >
                            <code>{key.armor()}</code>
                        </pre>
                    </div>
                </TuiPanel>
            </section>
        </article>
    );
}
