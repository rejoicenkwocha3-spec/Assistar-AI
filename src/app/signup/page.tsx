import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Create your account" subtitle="Set up your workspace and build your first assistant."
      footer={<>Already have an account? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-forest hover:underline">Sign in</Link></>}>
      <SignupForm next={next} />
    </AuthShell>
  );
}
