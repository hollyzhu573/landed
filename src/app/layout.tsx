import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/src/components/layout/Sidebar";
import SearchPalette from "@/src/components/layout/SearchPalette";
import { SearchProvider } from "@/src/lib/search-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Landed",
  description: "Personal recruiting tracker for new grad designers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#FAFAF8] text-zinc-900">
        <SearchProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
          <SearchPalette />
        </SearchProvider>
      </body>
    </html>
  );
}
