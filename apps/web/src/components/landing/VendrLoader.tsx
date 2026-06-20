"use client";

import { useEffect, useState } from "react";

export function VendrLoader() {
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRemoved(true), 2500);
    return () => clearTimeout(t);
  }, []);

  if (removed) return null;

  return (
    <div className="v-curtain" aria-hidden="true">
      <div className="v-curtain-bloom" />
    </div>
  );
}
