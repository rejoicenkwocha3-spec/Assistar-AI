import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { getContext } from "@/lib/context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getContext();
  if (ctx.profile && !ctx.profile.onboarded) redirect("/onboarding");
  return (
    <Sidebar orgs={ctx.organizations} activeOrgId={ctx.orgId} userName={ctx.profile?.full_name || ctx.user.email || "Account"} role={ctx.role}>
      {children}
    </Sidebar>
  );
}
