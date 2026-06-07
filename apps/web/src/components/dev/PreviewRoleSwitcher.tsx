"use client";

import { useEffect, useState } from "react";
import {
  getStoredPreviewRole,
  isDevPreviewMode,
  PREVIEW_ROLE_STORAGE_KEY,
  type PreviewRole,
} from "@/lib/preview/devPreview";
import styles from "./PreviewRoleSwitcher.module.css";

const roles: Array<{ label: string; value: PreviewRole }> = [
  { label: "Client", value: "CLIENT" },
  { label: "Creative", value: "CREATIVE" },
  { label: "Admin", value: "ADMIN" },
];

export function PreviewRoleSwitcher() {
  const [role, setRole] = useState<PreviewRole>("CLIENT");

  useEffect(() => {
    setRole(getStoredPreviewRole());
  }, []);

  if (!isDevPreviewMode()) {
    return null;
  }

  return (
    <div className={styles.root} aria-label="Development preview role switcher">
      <span>Preview</span>
      <div className={styles.segmented}>
        {roles.map((item) => (
          <button
            key={item.value}
            type="button"
            data-active={role === item.value}
            onClick={() => {
              window.localStorage.setItem(PREVIEW_ROLE_STORAGE_KEY, item.value);
              setRole(item.value);
              window.dispatchEvent(new CustomEvent("vendr-preview-role-change"));
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
