import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Deriverse Analytics | Trading Dashboard",
  description: "Comprehensive trading analytics dashboard for Deriverse DEX on Solana. Track PnL, win rate, drawdown, and more.",
  keywords: ["Deriverse", "Solana", "DEX", "Trading", "Analytics", "Dashboard"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen`} suppressHydrationWarning>
        <Providers>
          <Header />
          <main className="container py-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
