import type { Metadata } from "next";
import InsiderSignupForm from "../InsiderSignupForm";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Join as a creative",
  description:
    "Join the VendrStudio Insider Programme as a photographer or videographer before launch.",
  alternates: { canonical: "https://vendr.studio/artists" },
};

export default function ArtistsSignupPage() {
  return (
    <main className={styles.page}>
      <section className={styles.signupPage}>
        <div>
          <span className={styles.sectionLabelViolet}>Creative access</span>
          <h1>Join the founding creative community</h1>
          <p>
            Photographers and videographers can join early, build visibility before launch, and earn R50 per verified referral on their first payout, capped at R500.
          </p>
        </div>
        <div className={styles.signupPanel}>
          <InsiderSignupForm defaultUserType="ARTIST" />
        </div>
      </section>
    </main>
  );
}
