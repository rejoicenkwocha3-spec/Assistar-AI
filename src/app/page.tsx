import Link from "next/link";
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-extrabold text-navy">Every great hire starts with a better experience.</h1>
      <p className="text-muted">Hire smarter. Welcome better. Grow faster.</p>
      <div className="flex gap-3">
        <Link href="/signup" className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white">Get Started</Link>
        <Link href="/login" className="rounded-lg border border-line bg-white px-5 py-2.5 font-semibold text-navy">Log in</Link>
      </div>
      <p className="text-sm text-muted">© 2026 Onboard AI</p>
    </main>
  );
}
