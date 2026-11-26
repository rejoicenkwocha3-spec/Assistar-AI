import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Service role client. Server only. Bypasses RLS, so every query must filter by organization explicitly. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured on the server.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const hasServiceRole = () => !!process.env.SUPABASE_SERVICE_ROLE_KEY;
