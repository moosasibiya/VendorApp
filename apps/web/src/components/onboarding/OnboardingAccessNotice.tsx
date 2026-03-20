"use client";

import Link from "next/link";
import styles from "./OnboardingAccessNotice.module.css";

export function OnboardingAccessNotice({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div className={styles.notice}>
      <div className={styles.copy}>
        <strong>
          {compact
            ? "Read-only until onboarding is complete."
            : "You can browse, but editing is locked until onboarding is complete."}
        </strong>
        <p>
          Finish onboarding to create bookings, send messages, manage settings,
          and run booking or payment actions.
        </p>
      </div>
      <Link href="/onboarding" className={styles.link}>
        Finish onboarding
      </Link>
    </div>
  );
}
