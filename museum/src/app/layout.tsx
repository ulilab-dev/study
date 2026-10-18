import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Musée Lumière — A Journey Through Art History",
  description:
    "Walk through eight centuries of painting: a spotlight hero, a 4× magnifying lens on the masterpieces, a scrollable timeline of movements, a drag-to-look 3D virtual tour and a narrated audio guide.",
  keywords: [
    "art history",
    "museum",
    "virtual tour",
    "audio guide",
    "Renaissance",
    "Impressionism",
    "modern art",
  ],
  authors: [{ name: "Musée Lumière" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Musée Lumière — A Journey Through Art History",
    description:
      "A digital museum: spotlight hero, magnifying lens, genre timeline, 3D virtual tour and narrated audio guide.",
    siteName: "Musée Lumière",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased bg-museum-bg text-museum-ivory`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
