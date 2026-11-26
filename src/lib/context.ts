import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const ORG_COOKIE = "assistar_org";
export type Role = "owner" | "admin" | "manager" | "agent";

export const getContext = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // People who signed up through another app on the shared project get a workspace on first visit.
  let { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(id, name, website, industry, description)")
    .eq("user_id", user.id)
    .order("created_at");
  if (!memberships?.length) {
    await supabase.rpc("assistar_ensure_workspace");
    ({ data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id, role, organizations(id, name, website, industry, description)")
      .eq("user_id", user.id)
      .order("created_at"));
  }
  if (!memberships?.length) redirect("/login?error=config");

  const chosen = (await cookies()).get(ORG_COOKIE)?.value;
  const active = memberships.find((m) => m.organization_id === chosen) ?? memberships[0];
  const org = active.organizations as unknown as { id: string; name: string; website: string | null; industry: string | null; description: string | null };

  const { data: profile } = await supabase.from("profiles").select("full_name, email, onboarded").eq("id", user.id).maybeSingle();

  return {
    supabase,
    user,
    profile,
    org,
    orgId: active.organization_id as string,
    role: active.role as Role,
    organizations: memberships.map((m) => ({ id: m.organization_id as string, name: (m.organizations as unknown as { name: string }).name, role: m.role as Role })),
  };
});

export const canManage = (role: Role) => role === "owner" || role === "admin" || role === "manager";
export const isAdmin = (role: Role) => role === "owner" || role === "admin";

export type ActionState = { ok?: boolean; error?: string; message?: string } | null;
