import type { Metadata } from "next";
import { SimplePublicPage } from "@/components/public/SimplePublicPage";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Vendr Studio.",
};

export default function FaqPage() {
  return (
    <SimplePublicPage
      eyebrow="FAQ"
      title="Questions before launch."
      intro="The marketplace is being simplified around discovery, matching, planning, booking, and project management. More detailed answers will be added as rollout opens."
      points={[
        "Clients use Explore to discover creatives.",
        "Creative profiles show portfolio and trust details.",
        "Projects hold the active booking, planning, and delivery workflow.",
      ]}
      ctaLabel="Contact Vendr"
      ctaHref="/contact"
    />
  );
}
