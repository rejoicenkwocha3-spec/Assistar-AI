"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetches server data on an interval so new customer messages appear without a manual reload. */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible" && !document.activeElement?.matches("textarea, input")) router.refresh(); }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
