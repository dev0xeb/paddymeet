import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GroupChatProvider } from "@/context/GroupChatContext";
import GroupChatBar from "@/components/GroupChatBar";
import NavigationProgress from "@/components/NavigationProgress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Paddymeet — Find Your Crew",
    template: "%s | Paddymeet",
  },
  description: "Discover the best nightlife events in Nigeria. Buy tickets, join groups and connect with your crew.",
  keywords: ["nightlife", "events", "Nigeria", "tickets", "groups", "afrobeats", "parties", "Lagos", "Abuja", "Port Harcourt"],
  authors: [{ name: "Paddymeet" }],
  creator: "Paddymeet",
  metadataBase: new URL("https://paddymeet.com"),
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://paddymeet.com",
    siteName: "Paddymeet",
    title: "Paddymeet — Find Your Crew",
    description: "Discover the best nightlife events in Nigeria. Buy tickets, join groups and connect with your crew.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Paddymeet — Find Your Crew",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paddymeet — Find Your Crew",
    description: "Discover the best nightlife events in Nigeria. Buy tickets, join groups and connect with your crew.",
    images: ["/og-image.png"],
    creator: "@paddymeet",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
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
          <NavigationProgress />
          {children}
          <GroupChatBar />
        </GroupChatProvider>
      </body>
    </html>
  );
}