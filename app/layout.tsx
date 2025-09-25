/**
 * Agentbase Chat Application
 * 
 * This is an open-source Next.js chat template powered by Agentbase AI agents.
 * Original template created by Agentbase - https://agentbase.sh
 * 
 * Learn more about Agentbase SDK: https://docs.agentbase.sh
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agentbase Chat",
  description: "A Next.js chat application powered by Agentbase AI agents",
  icons: {
    icon: "https://www.agentbase.sh/logos/agentbase.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        // className={`${inter.className} antialiased`}
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
