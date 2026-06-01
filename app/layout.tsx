import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GroupChatProvider } from "@/context/GroupChatContext";
import GroupChatBar from "@/components/GroupChatBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paddymeet — Find Your Crew",
  description: "Discover the best nightlife events in Nigeria. Buy tickets, join groups and connect with your crew.",
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
      <body className="min-h-full flex flex-col">
        <GroupChatProvider>
          {children}
          <GroupChatBar />
        </GroupChatProvider>
      </body>
    </html>
  );
}