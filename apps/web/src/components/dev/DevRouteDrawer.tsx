"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./DevRouteDrawer.module.css";

type DevRoute = {
  label: string;
  href: string;
};

type DevRouteGroup = {
  title: string;
  routes: DevRoute[];
};

const ROUTE_GROUPS: DevRouteGroup[] = [
  {
    title: "Prelaunch",
    routes: [
      { label: "Landing", href: "/" },
      { label: "Confirmed", href: "/confirmed" },
    ],
  },
];

export function DevRouteDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === "d" &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey
      ) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <aside className={styles.root} aria-label="Development route navigation">
      {!open && (
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setOpen(true)}
          aria-label="Open page navigation drawer"
        >
          <Menu size={18} aria-hidden="true" />
          <span className={styles.toggleLabel}>Pages</span>
        </button>
      )}

      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div className={styles.title}>
              <span className={styles.eyebrow}>Temporary</span>
              <span className={styles.heading}>Page Drawer</span>
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Close page navigation drawer"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.content}>
            {ROUTE_GROUPS.map((group) => (
              <section key={group.title} className={styles.section}>
                <h2 className={styles.sectionTitle}>{group.title}</h2>
                {group.routes.map((route) => {
                  const targetPath = route.href.split("?")[0];
                  const isActive = pathname === targetPath;

                  return (
                    <Link
                      key={route.href}
                      className={`${styles.link} ${isActive ? styles.active : ""}`}
                      href={route.href}
                      onClick={() => setOpen(false)}
                    >
                      <span className={styles.label}>{route.label}</span>
                      <span className={styles.path}>{route.href}</span>
                    </Link>
                  );
                })}
              </section>
            ))}

          </div>
        </div>
      )}
    </aside>
  );
}
