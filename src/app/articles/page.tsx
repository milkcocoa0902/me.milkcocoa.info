import React from "react";
import {redirect} from "next/navigation";

export default function BlogRoot(){
    redirect("/articles/p/1")
    return <></>
}