import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-5 text-center">
      <div>
        <Logo className="justify-center" />
        <h1 className="mt-8 font-display text-5xl font-bold">🔮</h1>
        <h2 className="mt-4 font-display text-2xl font-semibold">
          This reading isn&apos;t here
        </h2>
        <p className="mt-2 text-white/60">
          The page or reading you&apos;re looking for may have expired.
        </p>
        <Link href="/scan" className="btn-primary mt-8">
          Scan your palm
        </Link>
      </div>
    </main>
  );
}
