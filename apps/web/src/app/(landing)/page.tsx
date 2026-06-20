import type { Metadata } from "next";
import { VendrLanding } from "@/components/landing/VendrLanding";

export const metadata: Metadata = {
  title: "VENDR.STUDIO — Where Moments Meet Creatives",
  description:
    "South Africa's first verified marketplace for booking photographers and videographers. No more ghosting. No more scams. Launching 1 July 2026.",
  alternates: { canonical: "https://vendr.studio/" },
  openGraph: {
    title: "VENDR.STUDIO — Where Moments Meet Creatives",
    description:
      "Join the Insider Programme for early access before the 1 July 2026 launch.",
    url: "https://vendr.studio/",
    siteName: "Vendr Studios",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VENDR.STUDIO — Where Moments Meet Creatives",
    description:
      "Early access for South African clients, photographers, and videographers.",
  },
};

export default function HomePage() {
  return <VendrLanding />;
}
