import { create } from "zustand";

interface AudioStore {
  // --- existing fields (backward compat) ---
  isPlaying: boolean;
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  bass: number;
  mid: number;
  treble: number;
  volume: number;

  // --- Meyda scalar features ---
  spectralCentroid: number;
  spectralCrest: number;
  spectralFlatness: number;
  spectralFlux: number;
  spectralKurtosis: number;
  spectralRolloff: number;
  spectralSkewness: number;
  spectralSlope: number;
  spectralSpread: number;
  energy: number;
  rms: number;
  zcr: number;
  perceptualSharpness: number;
  perceptualSpread: number;
  loudnessTotal: number;

  // --- Meyda array features ---
  chroma: number[];
  mfcc: number[];
  amplitudeSpectrum: Float32Array;

  // --- track info ---
  currentTrack: string | null;
  isLoading: boolean;

  // --- setters ---
  setIsPlaying: (playing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setFrequencyData: (data: Uint8Array) => void;
  setTimeData: (data: Uint8Array) => void;
  setBands: (bass: number, mid: number, treble: number) => void;
  setVolume: (volume: number) => void;
  setMeydaFeatures: (features: Partial<MeydaBatchUpdate>) => void;
  setCurrentTrack: (track: string | null) => void;
}

interface MeydaBatchUpdate {
  frequencyData: Uint8Array;
  bass: number;
  mid: number;
  treble: number;
  volume: number;
  spectralCentroid: number;
  spectralCrest: number;
  spectralFlatness: number;
  spectralFlux: number;
  spectralKurtosis: number;
  spectralRolloff: number;
  spectralSkewness: number;
  spectralSlope: number;
  spectralSpread: number;
  energy: number;
  rms: number;
  zcr: number;
  perceptualSharpness: number;
  perceptualSpread: number;
  loudnessTotal: number;
  chroma: number[];
  mfcc: number[];
  amplitudeSpectrum: Float32Array;
}

const EMPTY_CHROMA = Array(12).fill(0) as number[];
const EMPTY_MFCC = Array(13).fill(0) as number[];

export const useAudioStore = create<AudioStore>((set) => ({
  isPlaying: false,
  frequencyData: new Uint8Array(128),
  timeData: new Uint8Array(128),
  bass: 0,
  mid: 0,
  treble: 0,
  volume: 0,

  spectralCentroid: 0,
  spectralCrest: 0,
  spectralFlatness: 0,
  spectralFlux: 0,
  spectralKurtosis: 0,
  spectralRolloff: 0,
  spectralSkewness: 0,
  spectralSlope: 0,
  spectralSpread: 0,
  energy: 0,
  rms: 0,
  zcr: 0,
  perceptualSharpness: 0,
  perceptualSpread: 0,
  loudnessTotal: 0,

  chroma: EMPTY_CHROMA,
  mfcc: EMPTY_MFCC,
  amplitudeSpectrum: new Float32Array(0),

  currentTrack: null,
  isLoading: false,

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setFrequencyData: (frequencyData) => set({ frequencyData }),
  setTimeData: (timeData) => set({ timeData }),
  setBands: (bass, mid, treble) => set({ bass, mid, treble }),
  setVolume: (volume) => set({ volume }),
  setMeydaFeatures: (features) => set(features),
  setCurrentTrack: (currentTrack) => set({ currentTrack }),
}));
