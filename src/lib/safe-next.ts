/** Only allow same-site relative redirect targets (prevents open redirects). */
export const safeNext = (n: string | null | undefined, fallback = "/dashboard") =>
  n && n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : fallback;
