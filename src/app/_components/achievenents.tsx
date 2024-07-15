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
        date: "2017, MAR.",
        caption: "国立豊田工業高等専門学校卒業　電気・電子システム工学科卒業",
    },
    {
        id: randomUUID().toString(),
        date: "2017, APR.",
        caption: "信州大学工学部　電気電子工学科編入学",
    },
    {
        id: randomUUID().toString(),
        date: "2018, DEC.",
        caption: "信州未来アプリコンテスト0出場。KDDI賞",
    },
    {
        id: randomUUID().toString(),
        date: "2019, OCT.",
        caption: "株式会社GAFS 入社",
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
        date: "2021, APR.",
        caption: "株式会社J-TECH入社",
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
]

import { Box, VStack, Text, Heading, HStack } from "@kuma-ui/core";
import React from "react";
export const Achievements: React.FC = () => {
    return (
        <VStack m={"8px 16px"} p={"2px 8px"} bg="#e6e6e6" color="#333333" >
            <Heading as="h2" color="black" fontSize="24px">
                Achievement
            </Heading>
            {
                items.map((item: Items) => {
                    return (
                        <Box p={"1px 0px"} key={item.id}>
                            <HStack alignItems="center" gap={16}
                                _hover={{
                                    opacity: 0.8,
                                    color: "blue",
                                }}>

                                <Text width={150} margin={"8px 0px"}>
                                    {item.date}
                                </Text>
                                <Text margin={"8px 0px"}>
                                    {item.caption}
                                </Text>
                            </HStack>
                        </Box>
                    )
                })
            }
        </VStack>
    )
}