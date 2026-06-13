import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cosmic-400 to-cosmic-700 text-lg shadow-md shadow-cosmic-900/50">
        ✋
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">
        Palm<span className="text-cosmic-300">Insight</span>
      </span>
    </Link>
  );
}
