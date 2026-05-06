import React from "react";

export function MainContent({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="text-black mx-auto w-full md:w-[550px] lg:w-[800px] xl:w-[1000px] 2xl:w-[1400px] max-w-full px-0 md:px-4">
            {children}
        </div>
    )
}
