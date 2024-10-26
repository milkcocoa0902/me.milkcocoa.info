import { Box, VStack, Text, Heading, HStack, Flex, Grid, k, Link } from "@kuma-ui/core";
import React from "react";
import {randomUUID} from "node:crypto";


type Menu = {
    id: string,
    text: string,
    to: string
}

const socialLinks: Menu[] = [
    {
        id: randomUUID().toString(),
        text: "ホーム",
        to: "/"
    },
    {
        id: randomUUID().toString(),
        text: "ブログ",
        to: "/blog"
    },
    {
        id: randomUUID().toString(),
        text: "GPG Key",
        to: "/gpg"
    },
]

export const Header: React.FC = () => {
    return (
        <Flex
            zIndex={"1000"}
            justifyContent={["space-around", "left"]}
            flexDir={['column', 'row']}
            alignItems={"center"}
            bg={"#333333"}
            position={"sticky"}
            top={"0"}
            p={"8px 16px"}
        >
            {
                socialLinks.map((menu: Menu) => {
                    return (
                        <Box
                            p={"0px 16px"}
                            key={menu.id}
                        >
                            <Link href={menu.to} style={{ textDecoration: "none" }}>
                                <Heading as="h2" color={"white"}>{menu.text}</Heading>
                            </Link>
                        </Box>
                    )
                })
            }
        </Flex>
    )
}
