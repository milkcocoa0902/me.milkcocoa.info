import { Box, VStack, Text, Heading, HStack, Flex, Grid, k, Link } from "@kuma-ui/core";
import React from "react";

export function Main({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        // <KumaRegistry>
        <Box color={"black"} maxWidth={[
            // ~ 600px
            "550px",
            // 600px ~ 960px
            "550px",
            // 960px ~ 1264px
            "850px",
            // 1264px ~ 1904px
            "1180px",
            // 1904px ~ 
            "1600px"]} m={"auto"}>
                {children}
            </Box>
        // {/* </KumaRegistry> */}
    )
}
