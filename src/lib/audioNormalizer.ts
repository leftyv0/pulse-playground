import type { AudioFeature } from "@/store/shockWaveStore";

interface FeatureRange {
  min: number;
  max: number;
  frameCount: number;
  lastTime: number;
  lastResult: number;
}

const BOOTSTRAP_FRAMES = 30;
const DECAY_FACTOR = 0.992;
const MIN_RANGE = 0.001;
/** Calls within this window are considered same-frame (avoids double-update). */
const DEDUP_MS = 2;

const ranges: Partial<Record<AudioFeature, FeatureRange>> = {};

/**
 * Returns a 0–1 normalized value for the given audio feature based on its
 * recently observed min/max range. Adapts automatically to any feature's
 * natural scale so thresholds work universally.
 *
 * Idempotent within a single frame — repeated calls with the same feature
 * return the cached result without mutating range state.
 */
export function getNormalizedAudioValue(
  audio: { [K in AudioFeature]?: number },
  feature: AudioFeature
): number {
  const raw = audio[feature];
  if (raw == null || !isFinite(raw)) return 0;

  const now = performance.now();

  let r = ranges[feature];
  if (!r) {
    r = { min: raw, max: raw, frameCount: 0, lastTime: 0, lastResult: 0 };
    ranges[feature] = r;
  }

  // Same-frame dedup: return cached result if called again within DEDUP_MS
  if (now - r.lastTime < DEDUP_MS) {
    return r.lastResult;
  }
  r.lastTime = now;

  r.frameCount++;

  if (r.frameCount <= BOOTSTRAP_FRAMES) {
    // Bootstrap phase: expand range directly from observed values
    if (raw < r.min) r.min = raw;
    if (raw > r.max) r.max = raw;
  } else {
    // Exponential decay: range slowly contracts toward current values
    r.max = r.max * DECAY_FACTOR + raw * (1 - DECAY_FACTOR);
    r.min = r.min * DECAY_FACTOR + raw * (1 - DECAY_FACTOR);

    // But still expand if a new extreme is observed
    if (raw > r.max) r.max = raw;
    if (raw < r.min) r.min = raw;
  }

  const range = r.max - r.min;
  if (range < MIN_RANGE) {
    r.lastResult = 0;
    return 0;
  }

  const result = Math.max(0, Math.min(1, (raw - r.min) / range));
  r.lastResult = result;
  return result;
}

/** Clear all tracked ranges — call on track change. */
export function resetNormalization(): void {
  for (const key of Object.keys(ranges)) {
    delete ranges[key as AudioFeature];
  }
}
