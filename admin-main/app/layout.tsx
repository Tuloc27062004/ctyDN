import "./globals.css";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { auth } from "@/auth";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
