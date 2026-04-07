import type { Metadata } from "next";
import { Bebas_Neue, DM_Serif_Display, Manrope } from "next/font/google";
import CursorEffects from "@/components/global/CursorEffects";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-bebas",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif-display",
});

export const metadata: Metadata = {
  title: "VendrMan",
  description: "Book trusted creatives on a secure, premium marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${bebasNeue.variable} ${dmSerifDisplay.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,450,0,0"
        />
      </head>
      <body>
        <CursorEffects />
        {children}
      </body>
    </html>
  );
}
