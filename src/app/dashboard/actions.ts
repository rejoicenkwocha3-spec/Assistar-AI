"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ORG_COOKIE } from "@/lib/context";

export async function switchOrganization(fd: FormData) {
  const orgId = String(fd.get("orgId") ?? "");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // Only switch to an organization the user actually belongs to.
  const { data } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).eq("organization_id", orgId).maybeSingle();
  if (!data) return;
  (await cookies()).set(ORG_COOKIE, orgId, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/dashboard", "layout");
}
