
import { Box, VStack, Text, Heading, HStack, Flex, Grid, k } from "@kuma-ui/core";
import { RiAccountCircleFill } from 'react-icons/ri'
import { HiMail } from 'react-icons/hi'
import { HiBuildingOffice2 } from 'react-icons/hi2'
import { FaBirthdayCake } from 'react-icons/fa'
import React from "react";
import { StaticImageData } from 'next/image';
import { Card } from "./card";


import CocoaDiskInfo from '@/../public/assets/works/CocoaDiskInfo.png'
import NoteForBabyFood from '@/../public/assets/works/GoodByeMilk.jpg'
import CocoaZip from '@/../public/assets/works/CocoaZip.jpg'
import CocoaTweet from '@/../public/assets/works/cocoatweet.png'
import PantoryKeeper from '@/../public/assets/works/pantrykeeper.jpg'
import Petlog from '@/../public/assets/works/petlog.png'
import {randomUUID} from "node:crypto";

type Items = {
    id: string,
    title: string,
    description: string,
    image: StaticImageData,
    href: string
}

const items: Items[] = [
    {
        id: randomUUID().toString(),
        title: 'CocoaDiskInfo',
        description: 'Simple S.M.A.R.T. viewer for Linux',
        image: CocoaDiskInfo,
        href: 'https://github.com/koron0902/CocoaDiskInfo',
    },
    {
        id: randomUUID().toString(),
        title: '離乳食手帳',
        description: '日々の離乳食を記録するためのAndroidアプリ',
        image: NoteForBabyFood,
        href: 'https://play.google.com/store/apps/details?id=com.milkcocoa.info.goodbyemilk',
    },
    {
        id: randomUUID().toString(),
        title: 'CocoaZip',
        description: 'python製のZIPアーカイバ',
        image: CocoaZip,
        href: 'https://github.com/koron0902/CocoaZip',
    },
    {
        id: randomUUID().toString(),
        title: 'CocoaTweet',
        description: 'C++ユーザのためのパワフルで使いやすいTwitter API Library',
        image: CocoaTweet,
        href: 'https://github.com/koron0902/CocoaTweet',
    },
    {
        id: randomUUID().toString(),
        title: 'くらもり',
        description: '食材管理の決定版アプリ',
        image: PantoryKeeper,
        href: 'https://play.google.com/store/apps/details?id=com.milkcocoa.info.pantrykeeper',
    },
    {
        id: randomUUID().toString(),
        title: 'ぺったん',
        description: 'ペット飼い向けSNSアプリ',
        image: Petlog,
        href: 'https://petlog.milkcocoa.info',
    },
]
export const Works: React.FC = () => {
    return (
        <VStack m={16} p={8} bg="#e6e6e6" color="#333333" gap={16}>
            <Heading as="h2" color="black" fontSize="24px">
                Works
            </Heading>
            <Grid  gridTemplateColumns={"repeat(auto-fit, minmax(300px, 29%))"} columnGap={"4.3333%"} justifyContent={"center"}>
            {
                items.map((item: Items) => {
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