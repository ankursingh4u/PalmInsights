"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { AuthMenu } from "./AuthMenu";
import { PalmCapture } from "./PalmCapture";
import { ScanningView } from "./ScanningView";
import { PalmOverlay } from "./PalmOverlay";
import { LineCard } from "./LineCard";
import { Paywall } from "./Paywall";
import { PremiumTeaser } from "./PremiumTeaser";
import { ReportView } from "./ReportView";
import { CompatibilityPanel } from "./CompatibilityPanel";
import { DailyHoroscope } from "./DailyHoroscope";
import { SharePanel } from "./SharePanel";
import { preloadDetector, detectHand } from "@/lib/mediapipe";
import { loadImage, downscaleDataUrl } from "@/lib/image";
import {
  analyze,
  confirmPayment,
  fetchReport,
  me,
  startCheckout,
  trackEvent,
} from "@/lib/api";
import type { AnalysisResult, LineKey } from "@/lib/types";

type Phase = "capture" | "analyzing" | "results";

const SS = {
  image: "palm:image",
  scanId: "palm:scanId",
  result: "palm:result",
};
const tokenKey = (id: string) => `palm:token:${id}`;

export function ScanFlow({ priceLabel, baseUrl }: { priceLabel: string; baseUrl: string }) {
  const [phase, setPhase] = useState<Phase>("capture");
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [visible, setVisible] = useState<Set<LineKey>>(new Set());
  const [selected, setSelected] = useState<LineKey | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [saveReading, setSaveReading] = useState(false);
  const restored = useRef(false);
  const paywallTracked = useRef<string | null>(null);
  const resumeUnlock = useRef(false);

  // Preload the detection model as soon as the page mounts.
  useEffect(() => {
    preloadDetector();
  }, []);

  // Track paywall views once per scan (conversion funnel).
  useEffect(() => {
    if (
      phase === "results" &&
      result &&
      !result.unlocked &&
      scanId &&
      paywallTracked.current !== scanId
    ) {
      paywallTracked.current = scanId;
      trackEvent("paywall_viewed", scanId);
    }
  }, [phase, result, scanId]);

  const applyResult = useCallback((r: AnalysisResult) => {
    setResult(r);
    setVisible(new Set(r.lines.map((l) => l.key)));
    setPhase("results");
  }, []);

  // Restore prior session + handle Polar checkout redirect.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    const params = new URLSearchParams(window.location.search);
    const urlScanId = params.get("scanId");
    const checkoutId = params.get("checkout_id");
    const canceled = params.get("canceled");

    const savedImage = sessionStorage.getItem(SS.image);
    const savedScanId = sessionStorage.getItem(SS.scanId);
    const savedResult = sessionStorage.getItem(SS.result);

    if (savedImage) setImage(savedImage);
    if (savedScanId) setScanId(savedScanId);
    if (savedResult) {
      try {
        applyResult(JSON.parse(savedResult) as AnalysisResult);
      } catch {
        /* ignore */
      }
    }

    const id = urlScanId || savedScanId;
    if (canceled) {
      setUnlockError("Checkout canceled. Your free reading is still here.");
      cleanUrl();
    }

    // Returning from the login step → resume the unlock automatically.
    if (savedScanId && sessionStorage.getItem("palm:pendingUnlock") === savedScanId) {
      resumeUnlock.current = true;
    }

    if (id) {
      const existingToken = localStorage.getItem(tokenKey(id));
      if (checkoutId) {
        // Returned from Polar — confirm and unlock.
        void (async () => {
          setUnlockBusy(true);
          try {
            const { paid, token } = await confirmPayment(id, checkoutId);
            if (paid && token) await doUnlock(id, token);
          } catch (e) {
            setUnlockError((e as Error).message);
          } finally {
            setUnlockBusy(false);
            cleanUrl();
          }
        })();
      } else if (existingToken) {
        void doUnlock(id, existingToken).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanUrl() {
    window.history.replaceState({}, "", "/scan");
  }

  // After login, automatically continue the unlock the user started.
  useEffect(() => {
    if (resumeUnlock.current && scanId && result && !result.unlocked && !unlockBusy) {
      resumeUnlock.current = false;
      sessionStorage.removeItem("palm:pendingUnlock");
      void handleUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId, result]);

  async function doUnlock(id: string, tok: string) {
    const { result } = await fetchReport(id, tok);
    localStorage.setItem(tokenKey(id), tok);
    setToken(tok);
    setScanId(id);
    applyResult(result);
    try {
      navigator.vibrate?.([20, 40, 30, 40, 60]); // celebratory unlock buzz
    } catch {
      /* unsupported */
    }
  }

  async function handleImage(rawDataUrl: string) {
    setError(null);
    setUnlockError(null);
    setPhase("analyzing");
    setStatus("Loading vision model…");
    try {
      const dataUrl = await downscaleDataUrl(rawDataUrl, 1280);
      setImage(dataUrl);
      sessionStorage.setItem(SS.image, dataUrl);

      setStatus("Detecting your hand…");
      const img = await loadImage(dataUrl);
      const det = await detectHand(img);
      if (!det) {
        setError(
          "We couldn't find a clear hand. Use an open palm facing the camera, with good lighting, and try again."
        );
        setPhase("capture");
        return;
      }

      setStatus("Reading your palm lines…");
      const resp = await analyze(det.landmarks, det.handedness, {
        image: dataUrl,
        saveImage: saveReading,
      });
      // The AI checks whether this is actually a readable palm.
      if (resp.notPalm || !resp.scanId || !resp.result) {
        setError(
          resp.message ||
            "We couldn't read a clear palm in that photo. Hold your open hand up with your palm facing the camera, in good light, and try again."
        );
        setPhase("capture");
        return;
      }
      const { scanId, result } = resp;
      setScanId(scanId);
      setToken(null);
      sessionStorage.setItem(SS.scanId, scanId);
      sessionStorage.setItem(SS.result, JSON.stringify(result));
      applyResult(result);
      setSelected(null);
    } catch (e) {
      setError((e as Error).message || "Something went wrong analyzing your palm.");
      setPhase("capture");
    }
  }

  async function handleUnlock() {
    if (!scanId || unlockBusy) return;
    setUnlockBusy(true);
    setUnlockError(null);
    // Surface immediate feedback near the paywall.
    document.getElementById("paywall")?.scrollIntoView({ behavior: "smooth", block: "center" });
    try {
      // Require login before payment. Preserve the reading + resume after login.
      const { user } = await me();
      if (!user) {
        sessionStorage.setItem("palm:pendingUnlock", scanId);
        // image/scanId/result already in sessionStorage → restored on return.
        window.location.href = "/login?next=/scan";
        return;
      }

      const res = await startCheckout(scanId);
      if (res.url) {
        window.location.href = res.url; // redirect to Polar checkout
        return;
      }
      if (res.token) {
        await doUnlock(scanId, res.token);
      } else {
        setUnlockError("Could not unlock. Please try again.");
      }
    } catch (e) {
      const msg = (e as Error).message || "";
      setUnlockError(
        /not found/i.test(msg)
          ? "Your reading session expired. Please scan your palm again, then unlock."
          : msg || "Could not start checkout. Please try again."
      );
    } finally {
      setUnlockBusy(false);
    }
  }

  function toggleVisible(key: LineKey) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectLine(key: LineKey) {
    setSelected((prev) => (prev === key ? null : key));
    const el = document.getElementById(`line-${key}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function reset() {
    try {
      navigator.vibrate?.(12);
    } catch {
      /* unsupported */
    }
    setPhase("capture");
    setImage(null);
    setResult(null);
    setScanId(null);
    setToken(null);
    setSelected(null);
    setError(null);
    setUnlockError(null);
    sessionStorage.removeItem(SS.image);
    sessionStorage.removeItem(SS.scanId);
    sessionStorage.removeItem(SS.result);
  }

  const shareUrl = scanId ? `${baseUrl}/result/${scanId}` : baseUrl;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <div className="flex items-center gap-2">
          {phase === "results" && (
            <button onClick={reset} className="btn-ghost py-2 text-sm">
              ↺ Scan again
            </button>
          )}
          <AuthMenu />
        </div>
      </header>

      {phase === "capture" && (
        <div className="animate-fade-up space-y-4">
          <PalmCapture onImage={handleImage} />
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75">
            <input
              type="checkbox"
              checked={saveReading}
              onChange={(e) => setSaveReading(e.target.checked)}
              className="h-4 w-4 accent-cosmic-500"
            />
            <span>
              Save this reading to my history. Your palm photo is sent to our AI
              to read your lines either way; this just keeps it in your history.
            </span>
          </label>
          {error && (
            <div className="card border-red-400/30 bg-red-500/10 text-sm text-red-200">
              {error}
            </div>
          )}
          <p className="text-center text-xs text-white/40">
            Your hand is detected in your browser, then your photo is read by AI. By scanning you agree to our{" "}
            <Link href="/privacy" className="underline">
              privacy notice
            </Link>
            .
          </p>
        </div>
      )}

      {phase === "analyzing" && <ScanningView imageUrl={image} status={status} />}

      {phase === "results" && result && (
        <div className="space-y-5">
          {image && (
            <PalmOverlay
              imageUrl={image}
              lines={result.lines}
              visible={visible}
              selected={selected}
              onSelect={selectLine}
            />
          )}

          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-semibold">
              Your Palm Reading
            </h1>
            <span className="chip">{result.handedness} hand</span>
          </div>

          {/* Free + unlocked line cards */}
          <div className="space-y-4">
            {result.lines.map((line, i) => (
              <LineCard
                key={line.key}
                line={line}
                index={i}
                selected={selected === line.key}
                visible={visible.has(line.key)}
                onSelect={selectLine}
                onToggleVisible={toggleVisible}
              />
            ))}
          </div>

          {/* Daily palm horoscope (everyone) */}
          {scanId && <DailyHoroscope scanId={scanId} />}

          {/* Blurred premium teaser + paywall */}
          {!result.unlocked && (
            <div id="paywall" className="space-y-5 scroll-mt-4">
              <PremiumTeaser onUnlock={handleUnlock} busy={unlockBusy} />
              <Paywall
                priceLabel={priceLabel}
                busy={unlockBusy}
                error={unlockError}
                onUnlock={handleUnlock}
              />
            </div>
          )}

          {/* Premium report + features */}
          {result.unlocked && result.report && (
            <>
              <div className="flex items-center gap-2 pt-2">
                <span className="chip bg-cosmic-500/20 text-cosmic-200">
                  ✦ Deep Report unlocked
                </span>
              </div>
              <ReportView report={result.report} />
              {scanId && token && (
                <CompatibilityPanel scanId={scanId} token={token} />
              )}
            </>
          )}

          {/* Share */}
          <SharePanel result={result} shareUrl={shareUrl} scanId={scanId ?? undefined} />

          {unlockError && !result.unlocked && (
            <p className="text-center text-sm text-amber-300">{unlockError}</p>
          )}
        </div>
      )}
    </main>
  );
}
