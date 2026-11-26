import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const ORG_COOKIE = "assistar_org";
export type Role = "owner" | "admin" | "manager" | "agent";

type Membership = { organization_id: string; role: string; organizations: unknown };
const MEMBERSHIP_SELECT = "organization_id, role, organizations(id, name, website, industry, description)";

/** Loads the signed in user and their workspace. Never redirects on a workspace problem: it reports it instead. */
export const loadContext = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fetchMemberships = () => supabase.from("organization_members").select(MEMBERSHIP_SELECT).eq("user_id", user.id).order("created_at");
  let { data: memberships, error: memberError } = await fetchMemberships();

  // People who signed up through another app on the shared project get a workspace on first visit.
  // The follow up query targets the new organization by id: Next.js memoizes identical GET requests
  // within one render, so repeating the first query would return the stale empty result.
  let ensureError: string | null = null;
  if (!memberError && !memberships?.length) {
    const { data: newOrgId, error } = await supabase.rpc("assistar_ensure_workspace");
    if (error) ensureError = error.message;
    else if (newOrgId) ({ data: memberships, error: memberError } = await supabase.from("organization_members").select(MEMBERSHIP_SELECT).eq("user_id", user.id).eq("organization_id", newOrgId));
  }
  if (memberError || ensureError || !memberships?.length) {
    return { ok: false as const, user, detail: ensureError ?? memberError?.message ?? "No workspace was found for this account." };
  }

  const chosen = (await cookies()).get(ORG_COOKIE)?.value;
  const list = memberships as unknown as Membership[];
  const active = list.find((m) => m.organization_id === chosen) ?? list[0];
  const org = active.organizations as { id: string; name: string; website: string | null; industry: string | null; description: string | null };
  const { data: profile } = await supabase.from("profiles").select("full_name, email, onboarded").eq("id", user.id).maybeSingle();

  return {
    ok: true as const,
    supabase,
    user,
    profile,
    org,
    orgId: active.organization_id as string,
    role: active.role as Role,
    organizations: list.map((m) => ({ id: m.organization_id as string, name: (m.organizations as { name: string }).name, role: m.role as Role })),
  };
});

/** For pages: the layout has already verified the workspace, so a failure here is unexpected. */
export async function getContext() {
  const ctx = await loadContext();
  if (!ctx.ok) throw new Error(ctx.detail);
  return ctx;
}

export const canManage = (role: Role) => role === "owner" || role === "admin" || role === "manager";
export const isAdmin = (role: Role) => role === "owner" || role === "admin";

export type ActionState = { ok?: boolean; error?: string; message?: string } | null;
