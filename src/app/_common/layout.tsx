import { Box, VStack, Text, Heading, HStack, Flex, Grid, k, Link } from "@kuma-ui/core";
import React from "react";
import Head from "next/head";
import Script from "next/script";

export function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        // <KumaRegistry>
        <>
            <Script strategy="beforeInteractive" src="https://embed.zenn.studio/js/listen-embed-event.js"></Script>
            <Box color={"white"} minHeight={"100vh"} background={"#cccccc"} p={0} m={0}>
                {children}
            </Box>
        </>
        // </KumaRegistry>
    )
}
