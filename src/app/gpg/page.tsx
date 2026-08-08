import {Metadata} from "next";

import * as openpgp from "openpgp";
import {readFileSync} from "fs";
import {FaKey} from "react-icons/fa";

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

export default async function GPGKey() {

    const key = await openpgp.readKey({armoredKey: readFileSync(`${process.cwd()}/milkcocoa0902_public_key.asc`).toString()})
    return (
        <article className="flex flex-col px-[10px] py-0">

            <div className="flex justify-center content-center items-center">
                <div className="outline-[cadetblue] outline-solid border-none rounded-[100px] m-[10px] p-[30px] bg-white">
                    <FaKey aria-hidden="true" size={"64px"} color={"cadetblue"}/>
                </div>
            </div>

            <div className="flex justify-center content-center items-center">
                <div>
                    <h1 className="my-[10px] mx-0 text-2xl font-extrabold text-white">Public GPG Key</h1>
                </div>
            </div>

            <h2 className="p-0 mt-[5px] mb-[5px] mx-0 font-bold text-white">鍵ID</h2>
            <div className="outline-[cadetblue] outline-solid p-[4px_8px] bg-white">
                <code className="m-[10px] block overflow-x-auto p-0 font-bold">{key.getKeyID().toHex().toUpperCase()}</code>
            </div>

            <h2 className="p-0 mt-[15px] mb-[5px] mx-0 font-bold text-white">ユーザID</h2>
            <div className="flex flex-row outline-[cadetblue] outline-solid p-[4px_8px] bg-white overflow-x-scroll">
                {
                    Array.from(key.getUserIDs()[0])
                        .map(((c, idx) => {
                            return {index: idx, c: c}
                        }))
                        .sort(() => Math.random() - 0.5)
                        .map((obj) => {
                            return (<span className="my-[10px] p-0 font-bold" style={{order: obj.index, userSelect: "none"}}
                                          key={obj.index}>{obj.c}</span>)
                        })
                }
            </div>

            <h2 className="p-0 mt-[15px] mb-[5px] mx-0 font-bold text-white">指紋</h2>
            <div className="outline-[cadetblue] outline-solid p-[4px_8px] bg-white overflow-x-scroll">
                <pre className="m-[10px] p-0 font-bold" tabIndex={0}><code>{
                    chunk(Array.from(key.getFingerprint().toUpperCase()), 4)
                        .map((c) => c.join(""))
                        .reduce((a, b) => `${a} ${b}`, "")
                        .trim()
                }</code></pre>
            </div>

            <h2 className="p-0 mt-[15px] mb-[5px] mx-0 font-bold text-white">公開鍵</h2>
            <div className="outline-[cadetblue] outline-solid p-[4px_8px] bg-white">
                <pre className="m-[10px] whitespace-pre-wrap break-all p-0 font-bold" tabIndex={0}><code>{key.armor()}</code></pre>
            </div>
        </article>
    )
}
