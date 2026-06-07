"use client";

import { usePathname } from "next/navigation";
import { OnboardingAccessNotice } from "@/components/onboarding/OnboardingAccessNotice";
import { PreviewRoleSwitcher } from "@/components/dev/PreviewRoleSwitcher";
import { useAppSession } from "@/components/session/AppSessionContext";
import Sidebar from "../Sidebar/Sidebar";
import Topbar from "../Topbar/Topbar";
import styles from "./AppShell.module.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { onboardingLocked } = useAppSession();
  const showNotice = onboardingLocked && pathname !== "/onboarding";

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>
          {showNotice ? <OnboardingAccessNotice compact /> : null}
          {children}
        </div>
      </div>
      <PreviewRoleSwitcher />
    </div>
  );
}
