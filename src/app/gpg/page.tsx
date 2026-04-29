import {Metadata} from "next";

import * as openpgp from "openpgp";
import {readFileSync} from "fs";
import {FaKey} from "react-icons/fa";

export async function generateMetadata(): Promise<Metadata> {
    // templateを設定しているので、サイト名は自動で付く
    return {title: 'GPG Key'};
}

function chunk<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
        array.slice(i * size, (i + 1) * size),
    );
};

export default async function GPGKey() {

    const key = await openpgp.readKey({armoredKey: readFileSync(`${process.cwd()}/milkcocoa0902_public_key.asc`).toString()})
    return (
        <div className="flex flex-col px-[10px] py-0">

            <div className="flex justify-center content-center items-center">
                <div className="outline-[cadetblue] outline-solid border-none rounded-[100px] m-[10px] p-[30px] bg-white">
                    <FaKey size={"64px"} color={"cadetblue"}/>
                </div>
            </div>

            <div className="flex justify-center content-center items-center">
                <div>
                    <h2 className="my-[10px] mx-0 text-black">Public GPG Key</h2>
                </div>
            </div>

            <h3 className="p-0 mt-[5px] mb-[5px] mx-0 font-bold">鍵ID</h3>
            <div className="outline-[cadetblue] outline-solid p-[4px_8px] bg-white">
                <h4 className="p-0 m-[10px] font-bold　overflow-x-scroll"> {key.getKeyID().toHex().toUpperCase()} </h4>
            </div>

            <h3 className="p-0 mt-[15px] mb-[5px] mx-0 font-bold">ユーザID</h3>
            <div className="flex flex-row outline-[cadetblue] outline-solid p-[4px_8px] bg-white overflow-x-scroll">
                {
                    Array.from(key.getUserIDs()[0])
                        .map(((c, idx) => {
                            return {index: idx, c: c}
                        }))
                        .sort(() => Math.random() - 0.5)
                        .map((obj) => {
                            return (<h4 className="p-0 my-[10px] mx-0 font-bold" style={{order: obj.index, userSelect: "none"}}
                                          key={obj.index}> {obj.c}</h4>)
                        })
                }
            </div>

            <h3 className="p-0 mt-[15px] mb-[5px] mx-0 font-bold">指紋</h3>
            <div className="outline-[cadetblue] outline-solid p-[4px_8px] bg-white overflow-x-scroll">
                <h4 className="p-0 m-[10px] font-bold"> <pre>{
                    chunk(Array.from(key.getFingerprint().toUpperCase()), 4)
                        .map((c) => c.join(""))
                        .reduce((a, b) => `${a} ${b}`, "")
                        .trim()
                }</pre>
                </h4>
            </div>

            <h3 className="p-0 mt-[15px] mb-[5px] mx-0 font-bold">公開鍵</h3>
            <div className="outline-[cadetblue] outline-solid p-[4px_8px] bg-white">
                <h4 className="p-0 m-[10px] font-bold">
                    <pre className="whitespace-pre-wrap break-all">{key.armor()}</pre>
                </h4>
            </div>
        </div>
    )
}