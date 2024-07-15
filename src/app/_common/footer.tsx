import { Box, VStack, Text, Heading, HStack, Flex, Grid, k, Link } from "@kuma-ui/core";
import { FaXTwitter, FaGithub } from 'react-icons/fa6'
import { SiZenn } from 'react-icons/si'
import { IconType } from "react-icons";
import React from "react";
import {randomUUID} from "node:crypto";

type SocialLink = {
    id: string
    url: string
    icon: IconType
}

const socialLinks: SocialLink[] = [
    {
        id: randomUUID().toString(),
        url: "https://github.com/koron0902",
        icon: FaGithub
    },
    {
        id: randomUUID().toString(),
        url: "https://twitter.com/milkcocoa0902",
        icon: FaXTwitter
    },
    {
        id: randomUUID().toString(),
        url: "https://zenn.dev/milkcocoa0902",
        icon: SiZenn
    },
]

export const Footer: React.FC = () => {
    return (
        <VStack color={"whtie"} bg={"#333333"} position={"sticky"} top={"100vh"}  p={"8px 16px"}>
            <Flex justifyContent={"space-around"} flexDir={['column', 'row']} justify={"center"} alignContent={"center"} alignItems={"center"}>
                {
                    socialLinks.map((sl: SocialLink) => {
                        return (
                            <Link m={"4px 16px"} href={ sl.url } target="_blank" key={sl.id}  style={{ textDecoration: "none" }}>
                                {
                                    <sl.icon size={"32"} color={"white"}/>
                                }
                            </Link>
                        )
                    })
                }
            </Flex>
            <Box textAlign={["center", "end"]}>
                <div>&copy; 2019 - {new Date().getFullYear()} ここあ</div>
            </Box>
        </VStack>
    )
}
