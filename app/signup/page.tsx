import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthForm } from "@/components/AuthForm";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Sign up — PalmInsight" };

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-2xl px-5">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <Link href="/scan" className="btn-ghost">
          Scan Palm
        </Link>
      </header>
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
