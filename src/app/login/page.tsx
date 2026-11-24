import Link from "next/link";
import { AuthShell, Alert } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

const NOTICES: Record<string, string> = {
  verify_failed: "That verification link is invalid or has expired. Log in or request a new one.",
  config: "Authentication is not configured yet. Set the Supabase environment variables.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your AI assistants."
      footer={<>New to Assistar AI? <Link href="/signup" className="font-semibold text-forest hover:underline">Create an account</Link></>}>
      {error && NOTICES[error] && <div className="mb-4"><Alert kind="error">{NOTICES[error]}</Alert></div>}
      <LoginForm next={next} />
    </AuthShell>
  );
}
