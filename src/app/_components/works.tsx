"use client"

import { Box, VStack, Text, Heading, HStack, Flex, Grid, k } from "@kuma-ui/core";
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
        <VStack m={16} p={8} bg="#e6e6e6" color="#333333" gap={16}>
            <Heading as="h2" color="black" fontSize="24px">
                Works
            </Heading>
            <Grid  gridTemplateColumns={"repeat(auto-fit, 316px)"} gap={"24px"} justifyContent={"center"}>
                {
                    workItems(
                        itemsPerPage,
                        itemsPerPage * currentPage,
                    ).map((item: WorkItem) => {
                        return (
                            <Box m={["8px 8px"]} key={item.id}>
                                <Card
                                    title={item.title}
                                    caption={item.description}
                                    width={300}
                                    height={280}
                                    image={item.image}
                                    background="#f0f0f0"
                                />
                            </Box>
                        )
                    })
                }
            </Grid>
            <HStack justifyContent={"center"}>

                <BiSolidLeftArrow
                    size={24}
                    color={
                        currentPage === 0 ? "lightgray" : "black"
                    }
                    aria-disabled={currentPage === 0}
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                />
                <BiSolidRightArrow
                    size={24}
                    color={
                        currentPage === maxPage ? "lightgray" : "black"
                    }
                    aria-disabled={currentPage === maxPage}
                    onClick={() => setCurrentPage(Math.min(maxPage, currentPage + 1))}
                />
            </HStack>
            {/* <Flex justify={"start"} alignItems={"center"} flexWrap={"wrap"} flexDirection={"row"} gap={16} m={0}>
            {
                items.map((item: Items) => {
                    return (
                        <Card title={item.title} caption={item.description} width={300} height={280} image={item.image} background="#f0f0f0"/>
                    )
                })
            }
            </Flex> */}
        </VStack>
    )
}