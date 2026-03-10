import type { MeydaAudioFeature } from "meyda/dist/esm/main";

export type { MeydaFeaturesObject } from "meyda/dist/esm/main";

export const MEYDA_FEATURE_LIST: MeydaAudioFeature[] = [
  "amplitudeSpectrum",
  "chroma",
  "energy",
  "loudness",
  "mfcc",
  "perceptualSharpness",
  "perceptualSpread",
  "rms",
  "spectralCentroid",
  "spectralCrest",
  "spectralFlatness",
  // "spectralFlux" excluded — Meyda bug throws TypeError on first frame when
  // previousSignal is undefined.  We compute it manually in audio.ts instead.
  "spectralKurtosis",
  "spectralRolloff",
  "spectralSkewness",
  "spectralSlope",
  "spectralSpread",
  "zcr",
];
