"use client";

import React from "react";
import {Box, Flex, Link} from "@kuma-ui/core";

export default function PageNavigation(
    props: {
        current: number,
        isLastPage: boolean,
    }
) {
    return (
        <React.Fragment>
            <Flex flexDirection={"row"} justifyContent={"center"} alignItems={"center"} m={"8px 0px"} gap={64}>
                <Link
                    href={(props.current === 1) ? undefined : `/blog/p/${props.current - 1}`}
                    aria-disabled={props.current === 1}
                    style={{
                        textDecoration: "none",
                        cursor: (props.current === 1) ? "not-allowed" : "pointer",
                    }}
                >
                    <Box
                        borderRadius={"16px"}
                        bg={(props.current === 1) ? "lightslategray" : "#EAEAEA"}
                        borderColor={(props.current === 1) ? "lightslategray" : "darkblue"}
                        borderStyle={"solid"}
                        color={"#333333"}
                        p={"2px 16px"}
                    >
                        &lt; 前のページ
                    </Box>
                </Link>
                <Link
                    href={props.isLastPage ? undefined : `/blog/p/${props.current + 1}`}
                    aria-disabled={props.isLastPage}
                    style={{
                        textDecoration: "none",
                        cursor: props.isLastPage ? "not-allowed" : "pointer",
                    }}
                >
                    <Box
                        borderRadius={"20px"}
                        bg={props.isLastPage ? "lightslategray" : "#EAEAEA"}
                        borderColor={props.isLastPage ? "lightslategray" : "darkblue"}
                        borderStyle={"solid"}
                        color={"#333333"}
                        p={"2px 16px"}
                    >
                        次のページ &gt;
                    </Box>
                </Link>
            </Flex>
        </React.Fragment>
    )
}