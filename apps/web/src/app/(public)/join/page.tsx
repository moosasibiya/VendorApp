import type { Metadata } from "next";
import InsiderSignupForm from "../InsiderSignupForm";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Join as a client",
  description: "Join Vendr Studio early access before launch.",
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
            Join Vendr Studio early access for trusted creatives, project planning, and launch availability.
          </p>
        </div>
        <div className={styles.signupPanel}>
          <InsiderSignupForm defaultUserType="CLIENT" />
        </div>
      </section>
    </main>
  );
}
