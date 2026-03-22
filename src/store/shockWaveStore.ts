import { create, type StateCreator } from "zustand";
import { persist } from "zustand/middleware";

function debouncedPersist<T extends object>(
  config: StateCreator<T, [], []>,
  options: { name: string }
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return persist(config, {
    ...options,
    storage: {
      getItem: (name: string) => {
        const str = localStorage.getItem(name);
        return str ? JSON.parse(str) : null;
      },
      setItem: (name: string, value: unknown) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          localStorage.setItem(name, JSON.stringify(value));
        }, 500);
      },
      removeItem: (name: string) => localStorage.removeItem(name),
    },
    merge: (persisted, current) => {
      const p = persisted as Record<string, unknown> | undefined;
      if (!p) return current;
      // Deep-merge waves array so new fields get defaults from current
      if (Array.isArray(p.waves) && Array.isArray((current as Record<string, unknown>).waves)) {
        const currentWaves = (current as Record<string, unknown>).waves as Record<string, unknown>[];
        p.waves = (p.waves as Record<string, unknown>[]).map((w, i) => ({
          ...currentWaves[i],
          ...w,
        }));
      }
      return { ...current, ...p } as T;
    },
  });
}

export type AudioFeature =
  | "energy"
  | "rms"
  | "spectralFlux"
  | "bass"
  | "mid"
  | "treble"
  | "loudnessTotal"
  | "spectralCentroid"
  | "spectralCrest"
  | "spectralFlatness"
  | "spectralKurtosis"
  | "spectralRolloff"
  | "spectralSkewness"
  | "spectralSlope"
  | "spectralSpread"
  | "zcr"
  | "perceptualSharpness"
  | "perceptualSpread";

export interface WaveSettings {
  enabled: boolean;
  color: string;
  emissiveBoost: number;
  maxRadius: number;
  ringWidth: number;
  heightDisplacement: number;
  speed: number;
  lifetime: number;
  audioFeature: AudioFeature;
  audioSensitivity: number;
  triggerThreshold: number;
  ringWidthFade: number;
  fadeExponent: number;
  fadeStart: number;
  ringShape: number;
}

const DEFAULT_WAVES: [WaveSettings, WaveSettings, WaveSettings] = [
  {
    enabled: true,
    color: "#22d3ee",
    emissiveBoost: 3.0,
    maxRadius: 4.0,
    ringWidth: 0.5,
    heightDisplacement: 1.0,
    speed: 1.0,
    lifetime: 2.0,
    audioFeature: "energy",
    audioSensitivity: 1.0,
    triggerThreshold: 0.3,
    ringWidthFade: 0.5,
    fadeExponent: 1.5,
    fadeStart: 0.3,
    ringShape: 0.7,
  },
  {
    enabled: false,
    color: "#ff66ff",
    emissiveBoost: 3.0,
    maxRadius: 4.0,
    ringWidth: 0.5,
    heightDisplacement: 1.0,
    speed: 1.0,
    lifetime: 2.0,
    audioFeature: "bass",
    audioSensitivity: 1.0,
    triggerThreshold: 0.3,
    ringWidthFade: 0.5,
    fadeExponent: 1.5,
    fadeStart: 0.3,
    ringShape: 0.7,
  },
  {
    enabled: false,
    color: "#ffaa00",
    emissiveBoost: 3.0,
    maxRadius: 4.0,
    ringWidth: 0.5,
    heightDisplacement: 1.0,
    speed: 1.0,
    lifetime: 2.0,
    audioFeature: "spectralFlux",
    audioSensitivity: 1.0,
    triggerThreshold: 0.3,
    ringWidthFade: 0.5,
    fadeExponent: 1.5,
    fadeStart: 0.3,
    ringShape: 0.7,
  },
];

interface ShockWaveStore {
  waves: [WaveSettings, WaveSettings, WaveSettings];
  updateWave: (index: number, partial: Partial<WaveSettings>) => void;
}

export const useShockWaveStore = create<ShockWaveStore>()(
  debouncedPersist(
    (set) => ({
      waves: DEFAULT_WAVES,
      updateWave: (index, partial) =>
        set((state) => {
          const waves = [...state.waves] as [WaveSettings, WaveSettings, WaveSettings];
          waves[index] = { ...waves[index], ...partial };
          return { waves };
        }),
    }),
    { name: "pulse-shockwaves" }
  )
);
