import type { Metadata } from "next";
import { SimplePublicPage } from "@/components/public/SimplePublicPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Vendr Studio.",
};

export default function ContactPage() {
  return (
    <SimplePublicPage
      eyebrow="Contact"
      title="Talk to Vendr Studio."
      intro="For launch, creative onboarding, client access, or platform support, use the public channels while the full marketplace opens."
      points={[
        "Instagram: @vendr.studio",
        "TikTok: @vendr.studio",
        "LinkedIn: Vendr Studio",
      ]}
      ctaLabel="Join early access"
      ctaHref="/join"
    />
  );
}
