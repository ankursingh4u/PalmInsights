import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PalmInsight — Scan Your Palm. Discover Your Story.",
  description:
    "AI-powered palm reading. Upload or capture a photo of your palm and get instant, visual line-by-line interpretations.",
  openGraph: {
    title: "PalmInsight — Scan Your Palm. Discover Your Story.",
    description:
      "AI-powered palm reading with instant, visual interpretations of your life, heart, head and fate lines.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0b0614",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover", // enables env(safe-area-inset-*) for the app chrome
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <div className="starfield" aria-hidden />
        {children}
        <AppShell />
      </body>
    </html>
  );
}
