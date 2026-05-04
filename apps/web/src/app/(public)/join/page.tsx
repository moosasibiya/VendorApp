import type { Metadata } from "next";
import InsiderSignupForm from "../InsiderSignupForm";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Join as a client",
  description: "Join the VendrStudio Insider Programme as a client before launch.",
  alternates: { canonical: "https://vendr.studio/join" },
};

export default function JoinPage() {
  return (
    <main className={styles.page}>
      <section className={styles.signupPage}>
        <div>
          <span className={styles.sectionLabelBlue}>Client access</span>
          <h1>Book creatives before the public launch</h1>
          <p>
            Join the VendrStudio Insider Programme for early access to trusted photographers and videographers.
          </p>
        </div>
        <div className={styles.signupPanel}>
          <InsiderSignupForm defaultUserType="CLIENT" />
        </div>
      </section>
    </main>
  );
}
