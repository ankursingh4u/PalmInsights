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
        <p className="text-sm text-white/60">Last updated: 16 July 2026</p>

        <section>
          <h2 className="font-semibold text-white">What we collect</h2>
          <p className="mt-1 text-sm">
            We collect only what the app needs to work: your{" "}
            <strong>email address</strong> (to create and secure your account)
            and the <strong>palm photos</strong> you choose to scan, along with
            the readings generated from them. We do not sell your personal data.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">How your palm image is used</h2>
          <p className="mt-1 text-sm">
            When you scan your palm, your hand is first detected{" "}
            <strong>in your browser</strong>. To actually read your individual
            palm lines, your photo is then sent securely to a{" "}
            <strong>trusted AI vision provider</strong> for analysis. The reading
            you see is generated from your real image.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">
            Third-party AI &amp; service providers
          </h2>
          <p className="mt-1 text-sm">
            We share data only with the providers required to deliver the
            service, and only for that purpose:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>
              <strong>AI vision providers</strong> (Anthropic, OpenAI, and
              Google) — receive your palm photo solely to generate your reading.
              Your data is used only to provide this feature (
              <strong>limited use</strong>); it is not used by us or them to
              train advertising profiles, and is not sold.
            </li>
            <li>
              <strong>Supabase</strong> — securely stores your account and
              readings.
            </li>
            <li>
              <strong>Google Play</strong> — processes subscription payments.
            </li>
          </ul>
          <p className="mt-2 text-sm">
            By scanning a palm you <strong>consent</strong> to your image being
            sent to these AI providers for the sole purpose of generating your
            reading.
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
          <h2 className="font-semibold text-white">
            Data retention &amp; account deletion
          </h2>
          <p className="mt-1 text-sm">
            We keep your data only while your account is active. You can request
            deletion of your account and all associated data (readings and palm
            photos) at any time by emailing{" "}
            <a
              href="mailto:bolddevlive@gmail.com"
              className="text-cosmic-300 hover:underline"
            >
              bolddevlive@gmail.com
            </a>
            . We will delete it within 30 days of your request.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">Payments</h2>
          <p className="mt-1 text-sm">
            Subscription purchases are processed by{" "}
            <strong>Google Play</strong>. We never see or store your card
            details.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">Children</h2>
          <p className="mt-1 text-sm">
            PalmInsight is intended for users{" "}
            <strong>18 years of age and older</strong>. We do not knowingly
            collect personal data from children.
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
            Questions about your data, or want it deleted? Email{" "}
            <a
              href="mailto:bolddevlive@gmail.com"
              className="text-cosmic-300 hover:underline"
            >
              bolddevlive@gmail.com
            </a>{" "}
            and we&apos;ll help.
          </p>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
