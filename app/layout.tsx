import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Comixiad — Share Your Comics With the World",
    template: "%s | Comixiad",
  },
  description:
    "A free platform for comic creators around the world to publish, share and read comics, manga and webtoons online in many languages.",
  keywords: [
    "comics",
    "webtoon",
    "manga",
    "read comics online",
    "publish comics",
    "indie comics",
    "comic platform",
    "international comics",
  ],
  openGraph: {
    type: "website",
    siteName: "Comixiad",
    title: "Comixiad — Share Your Comics With the World",
    description:
      "Publish and read comics, manga and webtoons from creators in every country — free.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Comixiad — Share Your Comics With the World",
    description:
      "Publish and read comics, manga and webtoons from creators in every country — free.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Toaster richColors position="bottom-center" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
