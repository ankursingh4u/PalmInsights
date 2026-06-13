"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PalmArt } from "./PalmArt";

interface Props {
  onImage: (dataUrl: string) => void;
  busy?: boolean;
}

type Facing = "environment" | "user";

/**
 * Capture/upload control.
 *
 * Primary path is a live in-app camera (getUserMedia) with a shutter button
 * and front/back toggle — works on mobile and desktop. If the live camera is
 * unavailable or permission is denied, we fall back to a native file input
 * with `capture` (opens the phone camera app) so capture always works.
 */
export function PalmCapture({ onImage, busy }: Props) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const nativeCamRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [facing, setFacing] = useState<Facing>("environment");
  const [starting, setStarting] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Tear down the camera stream on unmount.
  useEffect(() => () => stopStream(), [stopStream]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = ""; // allow re-selecting the same file
  }

  const openCamera = useCallback(
    async (mode: Facing) => {
      // No camera API (or insecure context) → native camera app fallback.
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        nativeCamRef.current?.click();
        return;
      }
      setStarting(true);
      try {
        stopStream();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        streamRef.current = stream;
        setFacing(mode);
        setCameraOpen(true);
        // Attach after the video element renders.
        requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            void videoRef.current.play().catch(() => {});
          }
        });
      } catch {
        // Permission denied / no device → native camera app fallback.
        nativeCamRef.current?.click();
      } finally {
        setStarting(false);
      }
    },
    [stopStream]
  );

  function closeCamera() {
    stopStream();
    setCameraOpen(false);
  }

  function flipCamera() {
    void openCamera(facing === "environment" ? "user" : "environment");
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror the front camera so the captured image matches the preview.
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    closeCamera();
    onImage(dataUrl);
  }

  // --- Live camera viewfinder ----------------------------------------------
  if (cameraOpen) {
    return (
      <div className="card">
        <div className="relative overflow-hidden rounded-xl bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`aspect-square w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`}
          />
          {/* Palm-alignment guide */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-2/3 w-1/2 rounded-[40%] border-2 border-dashed border-white/50" />
          </div>
          <button
            type="button"
            onClick={closeCamera}
            className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-sm text-white backdrop-blur"
          >
            ✕ Cancel
          </button>
          <button
            type="button"
            onClick={flipCamera}
            className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-sm text-white backdrop-blur"
          >
            🔄 Flip
          </button>
        </div>

        <p className="mt-3 text-center text-sm text-white/60">
          Center your open palm in the outline, then tap the shutter.
        </p>
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={capturePhoto}
            disabled={busy}
            aria-label="Capture photo"
            className="h-16 w-16 rounded-full border-4 border-white bg-cosmic-500 shadow-lg transition active:scale-95 disabled:opacity-50"
          />
        </div>
      </div>
    );
  }

  // --- Idle (choose camera or upload) --------------------------------------
  return (
    <div className="card">
      <div className="rounded-xl border-2 border-dashed border-white/15 p-8 text-center">
        <PalmArt className="mx-auto h-28 w-28" />
        <h2 className="mt-3 font-display text-2xl font-semibold">
          Capture your palm
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/60">
          Hold your hand open with the palm facing the camera, fingers slightly
          spread, in good lighting.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            className="btn-primary"
            disabled={busy || starting}
            onClick={() => void openCamera("environment")}
          >
            {starting ? "Opening camera…" : "📷 Open Camera"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={busy}
            onClick={() => uploadRef.current?.click()}
          >
            ⬆️ Upload Image
          </button>
        </div>

        {/* Native camera-app fallback (used if live camera is unavailable). */}
        <input
          ref={nativeCamRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-white/50">
        <li className="rounded-lg bg-white/5 py-2">✅ Open hand</li>
        <li className="rounded-lg bg-white/5 py-2">💡 Good lighting</li>
        <li className="rounded-lg bg-white/5 py-2">🤚 Palm visible</li>
      </ul>
    </div>
  );
}
