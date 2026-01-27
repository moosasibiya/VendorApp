import type { Metadata } from "next";
import { Outfit } from "next/font/google";

// ✅ Global CSS (Tailwind directives + your custom CSS)
import "./globals.css";

// ✅ Font Awesome local CSS
import "@fortawesome/fontawesome-free/css/all.min.css";

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
    <html lang="en" className={outfit.variable}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,200..700,0..1,-50..200&display=optional"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
