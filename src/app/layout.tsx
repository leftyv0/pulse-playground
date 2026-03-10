import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AgentationOverlay from "@/components/Agentation";
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
  title: "Pulse Playground",
  description: "Audio-reactive visualisation playground",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <AgentationOverlay />
      </body>
    </html>
  );
}
