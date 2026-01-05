import React from "react";
import {redirect} from "next/navigation";

export default function BlogRoot(){
    redirect("/blog/p/1")
    return <></>
}