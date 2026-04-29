"use client"

import React, {Suspense} from "react";
import { Card } from "./card";

import {BiLeftArrow, BiRightArrow, BiSolidLeftArrow, BiSolidRightArrow} from "react-icons/bi";
import {workCount, WorkItem, workItems} from "../../lib/works";


export const Works: React.FC = () => {
    const [currentPage, setCurrentPage] = React.useState(0)
    const itemsPerPage = 3
    const maxPage = React.useMemo(()=>{
        return  Math.ceil(workCount() / itemsPerPage) - 1
    }, [])

    return (
        <div className="flex flex-col m-2 px-2 py-0.5 bg-[#e6e6e6] text-[#333333] gap-4">
            <h2 className="text-black text-2xl font-bold">
                Works
            </h2>
            <div 
                className="grid gap-6 justify-center"
                style={{ gridTemplateColumns: "repeat(auto-fit, 316px)" }}
            >
                {
                    workItems(
                        itemsPerPage,
                        itemsPerPage * currentPage,
                    ).map((item: WorkItem) => {
                        return (
                            <div className="m-2" key={item.id}>
                                <Card
                                    title={item.title}
                                    caption={item.description}
                                    width={300}
                                    height={280}
                                    image={item.image}
                                    background="#f0f0f0"
                                />
                            </div>
                        )
                    })
                }
            </div>
            <div className="flex justify-center gap-4">

                <BiSolidLeftArrow
                    size={24}
                    color={
                        currentPage === 0 ? "lightgray" : "black"
                    }
                    className={currentPage === 0 ? "cursor-not-allowed" : "cursor-pointer"}
                    aria-disabled={currentPage === 0}
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                />
                <BiSolidRightArrow
                    size={24}
                    color={
                        currentPage === maxPage ? "lightgray" : "black"
                    }
                    className={currentPage === maxPage ? "cursor-not-allowed" : "cursor-pointer"}
                    aria-disabled={currentPage === maxPage}
                    onClick={() => setCurrentPage(Math.min(maxPage, currentPage + 1))}
                />
            </div>
        </div>
    )
}