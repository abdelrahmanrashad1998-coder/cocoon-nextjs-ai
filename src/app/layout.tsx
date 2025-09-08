import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Cocoon Company For Aluminum Works",
    description: "Professional aluminum works and fabrication services",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link
                    href="https://db.onlinewebfonts.com/c/28c0ba929947563500b21da15a88c6fe?family=TacticSans-Reg"
                    rel="stylesheet"
                />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}
            >
                <AuthProvider>{children}</AuthProvider>
                <Toaster />
            </body>
        </html>
    );
}
