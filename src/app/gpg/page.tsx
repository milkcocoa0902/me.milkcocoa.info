// 投稿一覧画面

import {getAllArticles} from "../../lib/api";
import {Footer} from "../_common/footer";
import {Header} from "../_common/header";
import {ContentContainer} from "../_common/contentContainer";
import {Main} from "../_common/main";
import {Box, Button, Flex, Heading, Text} from "@kuma-ui/core";
import {Metadata} from "next";

import * as openpgp from "openpgp";
import {readFileSync} from "fs";
import {FaKey} from "react-icons/fa";
import {FaK} from "react-icons/fa6";

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

    const key = await openpgp.readKey( { armoredKey: readFileSync(`${process.cwd()}/milkcocoa0902_public_key.asc`).toString() } )
    return (
        <ContentContainer>
            <Header/>
            <Main>

                <Flex justify={"center"} alignContent={"center"} alignItems={"center"}>
                    <Box outline={"cadetblue"} outlineStyle={"solid"} borderRadius={"100px"} m={"10px"} p={"30px"} background={"white"}>
                        <FaKey size={"64px"} color={"cadetblue"} />
                    </Box>
                </Flex>

                <Flex justify={"center"} alignContent={"center"} alignItems={"center"}>
                    <Box>
                        <Text as={"h2"} m={"10px 0"}>Public GPG Key</Text>
                    </Box>
                </Flex>

                <Heading as={"h3"} p={"0"} m={"5px 0 5px 0"}>鍵ID</Heading>
                <Box outline={"cadetblue"} outlineStyle={"solid"} p={"4px 8px"} backgroundColor={"white"}>
                    <Text as={"h4"} p={"0"} m={"10px"}> {key.getKeyID().toHex().toUpperCase() } </Text>
                </Box>

                <Heading as={"h3"}  p={"0"} m={"15px 0 5px 0"}>ユーザID</Heading>
                <Flex flexDirection={"row"} outline={"cadetblue"} outlineStyle={"solid"} p={"4px 8px"} backgroundColor={"white"}>
                    {
                        Array.from(key.getUserIDs()[0])
                            .map(((c, idx) => {return { index: idx, c: c }}))
                            .sort(() => Math.random() - 0.5)
                            .map((obj) =>{
                                return (<Text as={"h4"} style={{order: obj.index, userSelect: "none"}} p={"0"} m={"10px 0"}> {obj.c}</Text>)
                            })
                    }
                </Flex>

                <Heading as={"h3"}  p={"0"} m={"15px 0 5px 0"}>指紋</Heading>
                <Box outline={"cadetblue"} outlineStyle={"solid"} p={"4px 8px"} backgroundColor={"white"}>
                    <Text as={"h4"} p={"0"} m={"10px"}> <pre>{
                        chunk(Array.from(key.getFingerprint().toUpperCase()), 4)
                            .map((c) => c.join(""))
                            .reduce((a, b) => `${a} ${b}`, "")
                            .trim()
                    }</pre></Text>
                </Box>

                <Heading as={"h3"}  p={"0"} m={"15px 0 5px 0"}>公開鍵</Heading>
                <Box outline={"cadetblue"} outlineStyle={"solid"} p={"4px 8px"} backgroundColor={"white"}>
                    <Text as={"h4"} p={"0"} m={"10px"}><pre>{ key.armor() }</pre></Text>
                </Box>
            </Main>
            <Footer/>
        </ContentContainer>
    )


}