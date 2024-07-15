import {Box, k} from '@kuma-ui/core'


export default function BlogDetailLayout({
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