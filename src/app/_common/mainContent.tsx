import React from "react";

export function MainContent({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="mx-auto w-full max-w-[1400px] px-3 text-black sm:px-4 lg:px-6">
            {children}
        </div>
    )
}
