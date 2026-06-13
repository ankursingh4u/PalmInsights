"use client";

import type { Landmark } from "./types";

// ---------------------------------------------------------------------------
// Client-side hand detection via MediaPipe Tasks Vision (HandLandmarker).
// Runs entirely in the browser — palm images never need to be uploaded for
// detection, which keeps the experience fast and privacy-friendly.
// ---------------------------------------------------------------------------

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

interface HandLandmarkerLike {
  detect: (image: HTMLImageElement | HTMLCanvasElement) => {
    landmarks?: { x: number; y: number; z: number }[][];
    handednesses?: { categoryName: string; score: number }[][];
  };
}

let _landmarker: HandLandmarkerLike | null = null;
let _loading: Promise<void> | null = null;

async function ensureLoaded(): Promise<void> {
  if (_landmarker) return;
  if (_loading) return _loading;

  _loading = (async () => {
    const vision = await import("@mediapipe/tasks-vision");
    const { HandLandmarker, FilesetResolver } = vision;
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    try {
      _landmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "IMAGE",
        numHands: 1,
      });
    } catch {
      // Fall back to CPU if the GPU delegate is unavailable.
      _landmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
        runningMode: "IMAGE",
        numHands: 1,
      });
    }
  })();

  return _loading;
}

export interface DetectionResult {
  landmarks: Landmark[];
  handedness: "Left" | "Right" | "Unknown";
  score: number;
}

/** Preload the model (call when the user lands on the scan page). */
export function preloadDetector(): void {
  void ensureLoaded().catch(() => {});
}

/**
 * Detect a single hand in an image element. Returns null if no hand is found.
 * Throws only if the model fails to load.
 */
export async function detectHand(
  image: HTMLImageElement | HTMLCanvasElement
): Promise<DetectionResult | null> {
  await ensureLoaded();
  if (!_landmarker) throw new Error("Detector failed to load");
  const res = _landmarker.detect(image);
  if (!res?.landmarks?.length) return null;

  const landmarks: Landmark[] = res.landmarks[0].map((l) => ({
    x: l.x,
    y: l.y,
    z: l.z,
  }));

  const handCat = res.handednesses?.[0]?.[0];
  const handedness: DetectionResult["handedness"] =
    handCat?.categoryName === "Left"
      ? "Left"
      : handCat?.categoryName === "Right"
      ? "Right"
      : "Unknown";
  const score = handCat?.score ?? 0.9;

  return { landmarks, handedness, score };
}
