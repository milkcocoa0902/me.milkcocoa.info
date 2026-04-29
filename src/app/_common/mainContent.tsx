import React from "react";

export function MainContent({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="text-black mx-auto w-[550px] md:w-[550px] lg:w-[800px] xl:w-[1000px] 2xl:w-[1400px] max-w-full">
            {children}
        </div>
    )
}
