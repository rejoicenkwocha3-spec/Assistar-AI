"use server";
import { revalidatePath } from "next/cache";
import { getContext, isAdmin, type ActionState } from "@/lib/context";

export async function inviteMember(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId, user, role } = await getContext();
  if (!isAdmin(role)) return { error: "Only owners and admins can invite people." };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const inviteRole = String(fd.get("role") ?? "agent");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!["admin", "manager", "agent"].includes(inviteRole)) return { error: "Choose a role." };
  const { data: existing } = await supabase.from("assistar_invitations").select("id").eq("organization_id", orgId).eq("email", email).eq("status", "pending").maybeSingle();
  if (existing) return { error: "There is already a pending invitation for this email." };
  const { error } = await supabase.from("assistar_invitations").insert({ organization_id: orgId, email, role: inviteRole, invited_by: user.id });
  if (error) return { error: error.message };
  await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: "member.invited", entity: "invitation", meta: { email, role: inviteRole } });
  revalidatePath("/dashboard/team");
  return { ok: true, message: "Invitation created. Copy the link below and send it to them. They must sign up or log in with this exact email." };
}

export async function revokeInvite(fd: FormData) {
  const { supabase, orgId, role } = await getContext();
  if (!isAdmin(role)) return;
  await supabase.from("assistar_invitations").update({ status: "revoked" }).eq("id", String(fd.get("id"))).eq("organization_id", orgId);
  revalidatePath("/dashboard/team");
}

export async function changeRole(fd: FormData) {
  const { supabase, orgId, user, role } = await getContext();
  if (!isAdmin(role)) return;
  const member = String(fd.get("userId")), newRole = String(fd.get("role"));
  await supabase.rpc("assistar_set_member_role", { org: orgId, member, new_role: newRole });
  await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: "member.role_changed", entity: "member", entity_id: member, meta: { role: newRole } });
  revalidatePath("/dashboard/team");
}

export async function removeMember(fd: FormData) {
  const { supabase, orgId, user, role } = await getContext();
  if (!isAdmin(role)) return;
  const member = String(fd.get("userId"));
  await supabase.rpc("assistar_remove_member", { org: orgId, member });
  await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: "member.removed", entity: "member", entity_id: member });
  revalidatePath("/dashboard/team");
}
