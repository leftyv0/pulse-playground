import type { TooltipDef } from "./ControlTooltip";
import { useAudioStore } from "@/store/audioStore";

export const MEYDA_TOOLTIPS: Record<string, TooltipDef> = {
  // ── Bands ──
  Bass: {
    title: "Bass",
    description:
      "Low-frequency energy (roughly 20–250 Hz). Tracks kick drums, bass guitar, and sub-bass rumble. High values indicate strong low-end presence.",
    type: "percentage",
    default: "0",
    format: "0–100 %",
    scope: "Low-frequency band",
  },
  Mid: {
    title: "Mid",
    description:
      "Mid-frequency energy (roughly 250–4 000 Hz). Covers vocals, guitars, snare body, and most melodic content. The dominant range for perceived loudness.",
    type: "percentage",
    default: "0",
    format: "0–100 %",
    scope: "Mid-frequency band",
  },
  Treble: {
    title: "Treble",
    description:
      "High-frequency energy (roughly 4 000–20 000 Hz). Captures hi-hats, cymbals, sibilance, and high-end shimmer. Sensitive to brightness and air in a mix.",
    type: "percentage",
    default: "0",
    format: "0–100 %",
    scope: "High-frequency band",
  },
  Volume: {
    title: "Volume",
    description:
      "Overall signal amplitude across all frequency bands. A simple loudness indicator — 0 is silence, 100 is maximum amplitude before clipping.",
    type: "percentage",
    default: "0",
    format: "0–100 %",
    scope: "Full spectrum",
  },

  // ── Core ──
  Energy: {
    title: "Energy",
    description:
      "Sum of squared amplitudes across the spectrum, reflecting total signal power. Useful as a general activity detector — spikes on transients, drops during quiet passages.",
    type: "float",
    default: "0",
    format: "arbitrary units",
    scope: "Full spectrum power",
  },
  RMS: {
    title: "RMS (Root Mean Square)",
    description:
      "Square root of the mean of squared sample values. A perceptually meaningful loudness measure — closer to how we hear volume than raw peak amplitude.",
    type: "percentage",
    default: "0",
    format: "0–100 %",
    scope: "Signal amplitude",
  },
  ZCR: {
    title: "ZCR (Zero Crossing Rate)",
    description:
      "Number of times the waveform crosses zero per frame. High values indicate noisy or high-frequency content (hi-hats, white noise); low values indicate tonal, bass-heavy signals.",
    type: "integer",
    default: "0",
    format: "crossings / frame",
    scope: "Waveform shape",
  },
  Loudness: {
    title: "Loudness (Total)",
    description:
      "Perceptual loudness estimate based on Stevens' power law. Models how the human ear perceives volume, accounting for frequency sensitivity — more accurate than raw amplitude.",
    type: "float",
    default: "0",
    format: "sone-like units",
    scope: "Perceptual loudness",
  },

  // ── Spectral ──
  Centroid: {
    title: "Spectral Centroid",
    description:
      "Weighted mean of the frequency spectrum — the \"center of mass\" of the sound. Higher values mean a brighter, more treble-heavy sound; lower values mean a darker, bassier timbre.",
    type: "float",
    default: "0",
    format: "Hz (frequency bin)",
    scope: "Spectral brightness",
  },
  Crest: {
    title: "Spectral Crest",
    description:
      "Ratio of peak energy to average energy in the spectrum. High values indicate a tonal, peaky sound (like a sine wave); low values indicate a flat, noise-like spectrum.",
    type: "float",
    default: "0",
    format: "ratio (≥ 1.0)",
    scope: "Tonality vs noise",
  },
  Flatness: {
    title: "Spectral Flatness",
    description:
      "Geometric mean divided by arithmetic mean of the spectrum. Ranges from 0 (tonal/harmonic) to 1 (white noise). Useful for distinguishing pitched instruments from percussive noise.",
    type: "float",
    default: "0",
    format: "0.000–1.000",
    scope: "Noise vs tone",
  },
  Flux: {
    title: "Spectral Flux",
    description:
      "Frame-to-frame change in spectral shape. Spikes on note onsets, drum hits, and transients. Near zero during sustained notes. A key feature for beat and onset detection.",
    type: "float",
    default: "0",
    format: "arbitrary units",
    scope: "Spectral change rate",
  },
  Kurtosis: {
    title: "Spectral Kurtosis",
    description:
      "Measures how \"peaked\" the spectrum is. High positive values mean energy is concentrated in a narrow frequency range; values near 0 mean a more uniform distribution.",
    type: "float",
    default: "0",
    format: "dimensionless",
    scope: "Spectral peakedness",
  },
  Rolloff: {
    title: "Spectral Rolloff",
    description:
      "Frequency below which 85% of the spectral energy is concentrated. A measure of spectral shape — low rolloff means most energy is in the bass, high rolloff means energy extends into treble.",
    type: "float",
    default: "0",
    format: "Hz (frequency bin)",
    scope: "Energy distribution",
  },
  Skewness: {
    title: "Spectral Skewness",
    description:
      "Asymmetry of the spectral distribution around its centroid. Positive values mean the spectrum tilts toward lower frequencies; negative means it tilts toward higher frequencies.",
    type: "float",
    default: "0",
    format: "dimensionless",
    scope: "Spectral asymmetry",
  },
  Slope: {
    title: "Spectral Slope",
    description:
      "Linear regression slope of the spectrum. Negative values (typical) mean energy decreases with frequency. Steeper slope = more bass-dominant; flatter = brighter sound.",
    type: "float",
    default: "0",
    format: "dB/bin (small values)",
    scope: "Spectral tilt",
  },
  Spread: {
    title: "Spectral Spread",
    description:
      "Standard deviation of the spectrum around its centroid. Low values mean energy is concentrated near one frequency (tonal); high values mean energy is spread across a wide range.",
    type: "float",
    default: "0",
    format: "Hz (bandwidth)",
    scope: "Spectral bandwidth",
  },

  // ── Perceptual ──
  Sharpness: {
    title: "Perceptual Sharpness",
    description:
      "Models the human perception of high-frequency prominence. Higher values indicate a \"sharper\", more piercing sound. Based on psychoacoustic models of critical band weighting.",
    type: "float",
    default: "0",
    format: "acum (sharpness unit)",
    scope: "Psychoacoustic brightness",
  },
  "P. Spread": {
    title: "Perceptual Spread",
    description:
      "How broadly the perceived energy is distributed across critical frequency bands. Low values mean the sound occupies a narrow perceptual range; high values mean it fills the hearing spectrum.",
    type: "float",
    default: "0",
    format: "0.000–1.000",
    scope: "Psychoacoustic bandwidth",
  },
};

const VALUE_MAP: Record<string, string> = {
  Bass: "bass",
  Mid: "mid",
  Treble: "treble",
  Volume: "volume",
  Energy: "energy",
  RMS: "rms",
  ZCR: "zcr",
  Loudness: "loudnessTotal",
  Centroid: "spectralCentroid",
  Crest: "spectralCrest",
  Flatness: "spectralFlatness",
  Flux: "spectralFlux",
  Kurtosis: "spectralKurtosis",
  Rolloff: "spectralRolloff",
  Skewness: "spectralSkewness",
  Slope: "spectralSlope",
  Spread: "spectralSpread",
  Sharpness: "perceptualSharpness",
  "P. Spread": "perceptualSpread",
};

export function getMeydaValue(key: string): unknown {
  const storeKey = VALUE_MAP[key];
  if (!storeKey) return undefined;
  return (useAudioStore.getState() as unknown as Record<string, unknown>)[storeKey];
}
