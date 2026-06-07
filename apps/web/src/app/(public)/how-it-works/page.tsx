import type { Metadata } from "next";
import { SimplePublicPage } from "@/components/public/SimplePublicPage";

export const metadata: Metadata = {
  title: "How It Works",
  description: "How Vendr Studio helps clients discover, match, plan, book, and manage creative projects.",
};

export default function HowItWorksPage() {
  return (
    <SimplePublicPage
      eyebrow="How it works"
      title="Discover. Match. Plan. Book. Manage."
      intro="Vendr Studio brings discovery, creative detail, project planning, messaging, scheduling, and support into one guided marketplace flow."
      points={[
        "Explore verified creative talent.",
        "Compare profiles, work, pricing, and availability.",
        "Plan the brief, files, shot list, and schedule before the project starts.",
      ]}
      ctaLabel="Start exploring"
      ctaHref="/explore"
    />
  );
}
