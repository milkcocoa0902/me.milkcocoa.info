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
        <div 
            className="flex flex-col z-[8] p-2 shadow-[4px_4px_2px_1px_rgba(0,0,0,0.2)]" 
            style={{ 
                backgroundColor: background, 
                borderRadius: `${borderRadius}px`,
                height: height ? `${height}px` : "400px",
                width: width ? `${width}px` : "350px"
            }}
        >
            {image ? <img src={image.src} className="w-full h-[180px] object-cover" style={{ borderRadius: `${borderRadius}px` }} alt={title}/> : <></>}
            <h3 className="py-1 m-0 text-xl font-bold">
                {title}
            </h3>
            <p className="p-0 m-0">
                {caption}
            </p>
        </div>
        
    )
}