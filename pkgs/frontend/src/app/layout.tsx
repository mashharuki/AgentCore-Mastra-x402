import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "x402 MCP AI Agent | AgentCore-Mastra",
  description:
    "AI-powered resource server integration with Amazon Bedrock and Google Gemini via Model Context Protocol",
  manifest: "/manifest.json",
  themeColor: "#0F172A",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "x402 MCP AI Agent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
