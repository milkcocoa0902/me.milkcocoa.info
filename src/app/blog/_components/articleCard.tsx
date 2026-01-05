import {Box, VStack, Text, Heading, HStack, Image, k, Grid, Flex} from "@kuma-ui/core";
import React from "react";
import { notFound } from "next/navigation";
import {Card} from "@/app/_components/card";

type ArticleCardProps = {
    slug: string,
    title: string
    tags: Array<string>
    caption?: string,
    published_at?: string,
    emoji?: string | null
    width?: number
    height?: number
    background?: string
    borderRadius?: number
}

function convertToDateString(date: Date){
    const [y, mo, d] = [date.getFullYear(), date.getMonth() + 1, date.getDay()]
    const [h, min, s] = [date.getHours(), date.getMinutes(), date.getSeconds()]
    return `${y}-${mo.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')} ${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
    slug = "",
    title = "",
    caption = "",
    published_at = "",
    tags = [],
    emoji = null,
    width = 350,
    height = 100,
    background = "white",
    borderRadius = 8 }) => {
    if (!slug) {
        notFound()
    }
    return (
        <HStack
            zIndex={8}
            p={8}
            background={"white"}
            boxShadow={"4px 4px 2px 1px rgba(0, 0, 0, .2)"}
            borderRadius={borderRadius}
            width={width}
            style={{textDecoration: "none"}}
        >
            <Box
                background={background}
                width={"80px"}
                height={"80px"}
                m={"0"}
                p={"auto"}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                borderRadius={borderRadius}>

                <Image
                    background={background}
                    m={"auto"}
                    textAlign={"center"}
                    src={`https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.4/2/svg/${(emoji ?? "📝").codePointAt(0)?.toString(16)}.svg`}
                    width={"64px"}
                    height={"64px"}
                    alt={emoji ?? ''}
                />
            </Box>
            <VStack
                p={"4px"}
                w={"calc(100% - 80px)"}
            >

                <
                    Heading
                    as="h4"
                    m={"0"}
                    style={{textDecoration: "none"}}
                >
                    {title}
                </Heading>

                {
                    (() => {
                        let date = new Date(published_at);
                        return (
                            <
                                Text
                                margin={"4px 0px"}
                                padding={0}
                                style={{textDecoration: "none"}}
                            >
                                {convertToDateString(date)}
                            </Text>)
                    })()
                }
            </VStack>

        </HStack>
    )
}
