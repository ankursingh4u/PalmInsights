"use client";

interface Props {
  imageUrl: string | null;
  status: string;
}

/** A radar-style scanning animation displayed over the palm during analysis. */
export function ScanningView({ imageUrl, status }: Props) {
  return (
    <div className="animate-fade-up">
      <div className="relative mx-auto overflow-hidden rounded-2xl border border-cosmic-400/30 bg-black/50 shadow-xl">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Scanning your palm"
            className="block w-full opacity-70 [filter:grayscale(0.2)_contrast(1.05)]"
            draggable={false}
          />
        ) : (
          <div className="aspect-[3/4] w-full" />
        )}

        {/* faint scan grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(167,139,250,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.5) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* rotating radar cone */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div
            className="h-[140%] w-[140%] rounded-full opacity-30 mix-blend-screen"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(139,92,246,0) 0deg, rgba(139,92,246,0) 300deg, rgba(167,139,250,0.55) 350deg, rgba(233,213,255,0.85) 360deg)",
              animation: "radar-spin 2.4s linear infinite",
            }}
          />
        </div>

        {/* horizontal sweep line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0">
          <div
            className="absolute inset-x-0"
            style={{
              height: "44px",
              marginTop: "-22px",
              background:
                "linear-gradient(to bottom, transparent, rgba(167,139,250,0.35) 45%, rgba(233,213,255,0.95) 50%, rgba(167,139,250,0.35) 55%, transparent)",
              boxShadow: "0 0 24px 4px rgba(167,139,250,0.5)",
              animation: "scan-sweep 2.2s ease-in-out infinite",
            }}
          />
        </div>

        {/* corner brackets */}
        {[
          "left-3 top-3 border-l-2 border-t-2",
          "right-3 top-3 border-r-2 border-t-2",
          "left-3 bottom-3 border-l-2 border-b-2",
          "right-3 bottom-3 border-r-2 border-b-2",
        ].map((c) => (
          <span
            key={c}
            className={`pointer-events-none absolute h-6 w-6 rounded-sm border-cosmic-300/80 ${c}`}
          />
        ))}

        {/* center reticle */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-16 w-16 animate-ping rounded-full border border-cosmic-300/40" />
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="display text-xl font-semibold">{status}</p>
        <p className="mt-2 text-sm text-white/50">Analyzing in your browser…</p>
      </div>
    </div>
  );
}
