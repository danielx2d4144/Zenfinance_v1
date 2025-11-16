import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import ExtensionErrorSuppressor from "@/components/ExtensionErrorSuppressor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZenFinance - Advanced Lending on ZenChain",
  description: "Decentralized lending platform with BTC-redeemable loans, validator vaults, and cross-chain capabilities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <ExtensionErrorSuppressor />
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
