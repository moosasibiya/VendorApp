import type { Metadata } from "next";
import InsiderSignupForm from "../../InsiderSignupForm";
import { fetchReferral, type InsiderUserType } from "@/lib/api";
import styles from "../../page.module.css";

type Props = {
  params: Promise<{ code: string }>;
};

type ReferralState = {
  valid: boolean;
  referralCode: string;
  referrerFirstName?: string;
  referrerType?: InsiderUserType;
  referrerVerified?: boolean;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: "Insider invite",
    description: "Join the VendrStudio Insider Programme through a verified invite link.",
    alternates: { canonical: `https://vendr.studio/insider/${encodeURIComponent(code)}` },
  };
}

export default async function InsiderInvitePage({ params }: Props) {
  const { code } = await params;
  const referral: ReferralState = await fetchReferral(code).catch(() => ({
    valid: false,
    referralCode: code.toUpperCase(),
  }));

  return (
    <main className={styles.page}>
      <section className={styles.signupPage}>
        <div>
          <span className={styles.sectionLabelBlue}>Insider invite</span>
          <h1>
            {referral.valid
              ? `${referral.referrerFirstName} invited you to Vendr Studios`
              : "Join the VendrStudio Insider Programme"}
          </h1>
          <p>
            {referral.valid
              ? "Complete your Insider signup, follow Instagram and TikTok, and the referral will count after manual verification."
              : "This invite code could not be verified, but you can still join directly."}
          </p>
        </div>
        <div className={styles.signupPanel}>
          <InsiderSignupForm
            defaultUserType={referral.referrerType === "ARTIST" ? "ARTIST" : "CLIENT"}
            referredBy={referral.valid ? referral.referralCode : undefined}
          />
        </div>
      </section>
    </main>
  );
}
