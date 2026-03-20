"use client";

import { createContext, useContext } from "react";
import type { User } from "@vendorapp/shared";

type AppSessionValue = {
  user: User;
  onboardingLocked: boolean;
};

const AppSessionContext = createContext<AppSessionValue | null>(null);

export function AppSessionProvider({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <AppSessionContext.Provider
      value={{
        user,
        onboardingLocked: !user.onboardingCompleted,
      }}
    >
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession(): AppSessionValue {
  const value = useContext(AppSessionContext);
  if (!value) {
    throw new Error("useAppSession must be used within AppSessionProvider");
  }
  return value;
}
