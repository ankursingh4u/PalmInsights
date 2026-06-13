import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Privacy Notice — PalmInsight" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-10">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <Link href="/scan" className="btn-ghost">
          Scan Palm
        </Link>
      </header>

      <article className="card space-y-5 leading-relaxed text-white/80">
        <h1 className="font-display text-3xl font-semibold text-white">
          Privacy Notice
        </h1>

        <section>
          <h2 className="font-semibold text-white">How your palm image is used</h2>
          <p className="mt-1 text-sm">
            When you scan your palm, your image is <strong>analyzed automatically
            in your browser</strong> using an on-device AI model to detect your
            hand. We do not need to upload your photo to our servers to read your
            palm.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">What we store</h2>
          <p className="mt-1 text-sm">
            We store the resulting <strong>reading data</strong> (detected
            patterns and interpretations) so you can revisit or share it. Your
            original palm photo is processed and{" "}
            <strong>may be deleted after processing</strong>; it is not included
            in shared links or share cards.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">Payments</h2>
          <p className="mt-1 text-sm">
            Premium purchases are handled by Polar. We never see or store your
            card details.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">For entertainment</h2>
          <p className="mt-1 text-sm">
            PalmInsight is intended for entertainment and self-reflection. Its
            readings are AI-generated interpretations and are not medical,
            financial, or predictive advice.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">Contact</h2>
          <p className="mt-1 text-sm">
            Questions about your data? Reach out and we&apos;ll help.
          </p>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
