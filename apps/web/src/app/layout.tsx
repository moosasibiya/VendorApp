import type { Metadata } from "next";
import { Outfit } from "next/font/google";

import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "optional",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "VendrMan - Find Your Perfect Creative",
  description: "Browse your favourite Photographers, Videographers and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
