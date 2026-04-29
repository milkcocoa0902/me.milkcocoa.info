import {randomUUID} from "node:crypto";

type Items = {
    id: string
    date: string,
    caption: string
}

const items: Items[] = [
    {
        id: randomUUID().toString(),
        date: "2015, JULY",
        caption: "Robocup SSL 世界大会参加",
    },
    {
        id: randomUUID().toString(),
        date: "2018, DEC.",
        caption: "信州未来アプリコンテスト0出場。KDDI賞",
    },
    {
        id: randomUUID().toString(),
        date: "2020, MAR.",
        caption: "CocoaDiskInfoを公開",
    },
    {
        id: randomUUID().toString(),
        date: "2020, JUNE",
        caption: "xlsxExtractor(CLI)を公開",
    },
    {
        id: randomUUID().toString(),
        date: "2020, DEC.",
        caption: "CocoaZip(CLI)を公開",
    },
    {
        id: randomUUID().toString(),
        date: "2021, FEB.",
        caption: "CocoaTweetを公開",
    },
    {
        id: randomUUID().toString(),
        date: "2021, AUG.",
        caption: "くらもりを公開",
    },
    {
        id: randomUUID().toString(),
        date: "2023, MAR.",
        caption: "ぺったんを公開",
    },
    {
        id: randomUUID().toString(),
        date: "2025, FEB.",
        caption: "Colotokを公開",
    },
]

import React from "react";
export const Achievements: React.FC = () => {
    return (
        <div className="flex flex-col m-[8px_16px] p-[2px_8px] bg-[#e6e6e6] text-[#333333]">
            <h2 className="text-black text-[24px] font-bold">
                Achievement
            </h2>
            {
                items.map((item: Items) => {
                    return (
                        <div className="p-[1px_0px]" key={item.id}>
                            <div className="flex items-center gap-4 hover:opacity-80 hover:text-blue-600">
                                <div className="w-[150px] my-2 shrink-0">
                                    {item.date}
                                </div>
                                <div className="my-2">
                                    {item.caption}
                                </div>
                            </div>
                        </div>
                    )
                })
            }
        </div>
    )
}