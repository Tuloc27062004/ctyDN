import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import TanstackProvider from "@/components/provider/tanstack-provider";
import AuthProvider from "@/components/provider/auth-provider";
import InquiryCartProvider from "@/components/provider/inquiry-cart-provider";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Suspense } from "react";
import ContentProtection from "@/components/protection/ContentProtection";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EcoCrete Vietnam | Eco-Friendly Concrete Products",
  description:
    "Discover our eco-friendly concrete products and sustainable building solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${playfair.variable} ${inter.variable} font-sans antialiased`}>
        <TanstackProvider>
          <ContentProtection />

          <Suspense fallback={null}>
            <AuthProvider>
              <InquiryCartProvider>{children}</InquiryCartProvider>
            </AuthProvider>
          </Suspense>

          <Toaster richColors position="top-center" duration={2000} />
          <WhatsAppButton className="fixed bottom-0 right-6 -translate-y-1/2 z-50" />
        </TanstackProvider>
      </body>
    </html>
  );
}