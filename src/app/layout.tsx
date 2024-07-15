import { KumaRegistry } from "@kuma-ui/next-plugin/registry"

export default function RootLayout({
   children,
}: {
  children: React.ReactNode
}) {
  return (
      <html>
      <body style={{ margin: 0, padding: 0 }}>
      <KumaRegistry>{children}</KumaRegistry>
      </body>
      </html>
  );
}