import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, DM_Serif_Display, Instrument_Serif, Manrope, Outfit, Space_Grotesk } from "next/font/google";
import { DevRouteDrawer } from "@/components/dev/DevRouteDrawer";
import CursorEffects from "@/components/global/CursorEffects";
import "material-symbols/outlined.css";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
  display: "swap",
});

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL ?? "https://vendr.studio"),
  title: {
    default: "Vendr Studios",
    template: "%s | Vendr Studios",
  },
  description:
    "A premium South African marketplace for discovering and booking verified creative talent.",
  openGraph: {
    title: "Vendr Studios",
    description:
      "Discover and book verified photographers, videographers, and creative talent across South Africa.",
    url: "/",
    siteName: "Vendr Studios",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vendr Studios",
    description:
      "A premium South African marketplace for discovering and booking verified creative talent.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${spaceGrotesk.variable} ${outfit.variable} ${dmSans.variable} ${manrope.variable} ${bebasNeue.variable} ${dmSerifDisplay.variable}`}
      suppressHydrationWarning
    >
      <body>
        <CursorEffects />
        {children}
        <DevRouteDrawer />
      </body>
    </html>
  );
}
