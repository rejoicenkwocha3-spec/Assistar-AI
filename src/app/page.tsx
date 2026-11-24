import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-3 text-sm font-semibold">
          <Link href="/login" className="px-3 py-2 text-ink hover:text-forest">Log in</Link>
          <Link href="/signup" className="rounded-lg bg-forest px-4 py-2 text-white hover:bg-forest-deep">Get Started</Link>
        </nav>
      </header>
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">
          Meet the AI assistants that move your business forward.
        </h1>
        <p className="mt-5 text-lg text-ink-muted">
          Build intelligent AI assistants that understand your customers, resolve requests, and automate business tasks across every conversation.
        </p>
        <Link href="/signup" className="mt-8 rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-white hover:bg-forest-deep">
          Build Your Assistant
        </Link>
      </section>
      <footer className="py-6 text-center text-sm text-ink-muted">© 2026 Assistar AI</footer>
    </main>
  );
}
