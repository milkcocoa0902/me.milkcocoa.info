import {Box} from '@kuma-ui/core'

export default function BlogLayout({
   children,
}: {
    children: React.ReactNode
}) {
    return (
        <Box>
            {children}
        </Box>
    );
}