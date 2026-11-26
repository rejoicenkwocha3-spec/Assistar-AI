import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "@/components/auth/ForgotForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we will send you a reset link."
      footer={<Link href="/login" className="font-semibold text-forest hover:underline">Back to sign in</Link>}>
      <ForgotForm />
    </AuthShell>
  );
}
