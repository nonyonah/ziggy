import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ziggy – Autonomous DeFi Yield Agent",
  description: "Autonomous USDC yield hunter on Base. Leveraging Morpho and Aerodrome for sustainable growth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-cosmic-gradient text-foreground flex flex-col">
            <Navbar />
            <main className="flex-grow pt-16">
              {children}
            </main>
            <footer className="border-t border-white/5 bg-background py-8">
              <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
                <p>© 2026 Ziggy Agent. Built for OpenClaw on Base.</p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
