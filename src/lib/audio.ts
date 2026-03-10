import type { MeydaFeaturesObject } from "./meydaTypes";
import { MEYDA_FEATURE_LIST } from "./meydaTypes";

export interface MeydaElementSetup {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  analyzer: { start(): void; stop(): void };
}

export async function createMeydaAnalyzerFromElement(
  audioElement: HTMLAudioElement,
  onFeatures: (features: Partial<MeydaFeaturesObject>) => void
): Promise<MeydaElementSetup> {
  const Meyda = (await import("meyda")).default;

  const ctx = new AudioContext();
  const source = ctx.createMediaElementSource(audioElement);
  source.connect(ctx.destination);

  // Configure Meyda for offline extraction
  Meyda.bufferSize = 1024;
  Meyda.sampleRate = ctx.sampleRate;

  // Register the AudioWorklet processor (replaces ScriptProcessorNode)
  await ctx.audioWorklet.addModule("/audio-capture-worklet.js");
  const workletNode = new AudioWorkletNode(ctx, "audio-capture-processor");
  source.connect(workletNode);
  workletNode.connect(ctx.destination);

  // We compute spectralFlux manually because Meyda's built-in extractor
  // throws a TypeError on the first frame (previousSignal is undefined).
  let prevSpectrum: Float32Array | null = null;
  let running = false;

  workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
    if (!running) return;

    const signal = e.data;
    const features = Meyda.extract(MEYDA_FEATURE_LIST, signal) as Partial<MeydaFeaturesObject> | null;
    if (!features) return;

    const spectrum = features.amplitudeSpectrum;
    let spectralFlux = 0;
    if (spectrum && prevSpectrum) {
      for (let i = 0; i < spectrum.length; i++) {
        const diff = Math.abs(spectrum[i]) - Math.abs(prevSpectrum[i]);
        spectralFlux += (diff + Math.abs(diff)) / 2;
      }
    }
    if (spectrum) {
      prevSpectrum = new Float32Array(spectrum);
    }
    (features as Record<string, unknown>).spectralFlux = spectralFlux;
    onFeatures(features);
  };

  const analyzer = {
    start() { running = true; },
    stop() { running = false; },
  };

  return { ctx, source, analyzer };
}

/**
 * Derive bass/mid/treble/volume from amplitudeSpectrum for backward compat.
 * Splits the spectrum into three equal bands and normalizes each.
 */
export function deriveBands(spectrum: Float32Array) {
  const len = spectrum.length;
  const third = Math.floor(len / 3);

  let max = 0;
  for (let i = 0; i < len; i++) {
    if (spectrum[i] > max) max = spectrum[i];
  }
  if (max === 0) max = 1;

  const bass = bandAvg(spectrum, 0, third) / max;
  const mid = bandAvg(spectrum, third, third * 2) / max;
  const treble = bandAvg(spectrum, third * 2, len) / max;
  const volume = bandAvg(spectrum, 0, len) / max;

  return { bass, mid, treble, volume };
}

function bandAvg(data: Float32Array, from: number, to: number): number {
  let sum = 0;
  for (let i = from; i < to; i++) sum += data[i];
  return sum / (to - from);
}

/**
 * Convert Float32Array amplitude spectrum to Uint8Array [0-255] for compat
 * with components that read frequencyData as Uint8Array.
 */
export function spectrumToUint8(spectrum: Float32Array): Uint8Array {
  let max = 0;
  for (let i = 0; i < spectrum.length; i++) {
    if (spectrum[i] > max) max = spectrum[i];
  }
  if (max === 0) max = 1;

  const out = new Uint8Array(spectrum.length);
  for (let i = 0; i < spectrum.length; i++) {
    out[i] = Math.min(255, Math.floor((spectrum[i] / max) * 255));
  }
  return out;
}
