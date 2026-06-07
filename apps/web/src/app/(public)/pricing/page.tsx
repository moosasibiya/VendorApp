import type { Metadata } from "next";
import { SimplePublicPage } from "@/components/public/SimplePublicPage";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Vendr Studio marketplace pricing and project fee information.",
};

export default function PricingPage() {
  return (
    <SimplePublicPage
      eyebrow="Pricing"
      title="Clear pricing before you commit."
      intro="Creative rates, project estimates, platform fees, and payout states are designed to stay visible from discovery through project completion."
      points={[
        "Creative rates remain visible on profiles where available.",
        "Project totals are finalized inside the request flow.",
        "Verified completion keeps client approvals and creative payouts accountable.",
      ]}
      ctaLabel="Browse creatives"
      ctaHref="/explore"
    />
  );
}
