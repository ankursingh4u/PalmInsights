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
            When you scan your palm, your hand is first detected{" "}
            <strong>in your browser</strong>. To actually read your individual
            palm lines, your photo is then sent securely to a{" "}
            <strong>trusted AI vision provider</strong> (such as Anthropic,
            OpenAI, or Google) for analysis. The reading you see is generated
            from your real image.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">What we store</h2>
          <p className="mt-1 text-sm">
            We store your <strong>reading</strong> (detected patterns and
            interpretations) and your palm photo with the reading, so the premium
            Deep Report can re-read it in higher detail and so it appears in your
            history. Your photo is <strong>never</strong> included in shared links
            or share cards — only the generated reading text is shareable.
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
