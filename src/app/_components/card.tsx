import { Box, VStack, Text, Heading, HStack, Image } from "@kuma-ui/core";
import React from "react";
import { StaticImageData } from "next/image";

type CardProps = {
    title?: string
    caption?: string,
    image?: StaticImageData | null
    width?: number
    height?: number
    background?: string
    borderRadius?: number
}

export const Card: React.FC<CardProps> = ({
    title = "",
    caption = "",
    image = null,
    width = 350,
    height = 400,
    background = "white",
    borderRadius = 8}) => {
    return (
        <VStack zIndex={8} p={8} boxShadow={"4px 4px 2px 1px rgba(0, 0, 0, .2)"} bg={background} borderRadius={borderRadius} height={height} width={width}>
            {image ? <Image src={image.src} width={width} height={200} borderRadius={borderRadius} alt={title}/> : <></>}
            <Heading
                as="h3"
                padding={"4px 0px"}
                margin={0}
            >
                {title}
            </Heading>
            <Text
                padding={0}
                margin={0}
            >
                {caption}
            </Text>
        </VStack>
        
    )
}