import type { Metadata } from "next";
import { SimplePublicPage } from "@/components/public/SimplePublicPage";

export const metadata: Metadata = {
  title: "About",
  description: "About Vendr Studio and the marketplace for South African creative work.",
};

export default function AboutPage() {
  return (
    <SimplePublicPage
      eyebrow="About"
      title="A cleaner way to commission creative work."
      intro="Vendr Studio is built for South African clients and creatives who need a trusted path from talent discovery to project delivery."
      points={[
        "Verified marketplace profiles.",
        "Project-first planning and communication.",
        "A workflow designed around trust, clarity, and delivery.",
      ]}
      ctaLabel="Join as a creative"
      ctaHref="/join"
    />
  );
}
