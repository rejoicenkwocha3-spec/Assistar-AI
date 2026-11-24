import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthShell title="Create your account" subtitle="Set up your workspace and build your first assistant."
      footer={<>Already have an account? <Link href="/login" className="font-semibold text-forest hover:underline">Log in</Link></>}>
      <SignupForm />
    </AuthShell>
  );
}
