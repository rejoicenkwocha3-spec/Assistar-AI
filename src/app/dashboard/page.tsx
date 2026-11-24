import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Welcome, {profile?.full_name ?? user.email}</h1>
        <form action="/auth/signout" method="post"><button className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-navy">Log out</button></form>
      </div>
      <p className="mt-2 text-muted">The full recruitment dashboard is built on this foundation in the next phase.</p>
    </main>
  );
}
