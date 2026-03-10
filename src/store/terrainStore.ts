"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NoiseType = "perlin" | "simplex" | "fbm" | "ridged" | "voronoi";

export interface AudioMapping {
  feature: string;
  sensitivity: number;
}

export interface TerrainState {
  // Noise
  noiseType: NoiseType;
  amplitude: number;
  frequency: number;
  speed: number;

  // FBM
  octaves: number;
  lacunarity: number;
  gain: number;

  // Visual
  pointSize: number;
  gridDensity: number;
  colorLow: string;
  colorMid: string;
  colorHigh: string;
  opacity: number;

  // Road
  roadEnabled: boolean;
  roadWidth: number;
  roadEdgeSoftness: number;
  roadColor: string;

  // Footpaths
  footpathEnabled: boolean;
  footpathWidth: number;
  footpathGap: number;
  footpathEdgeSoftness: number;
  footpathColor: string;

  // Camera
  cameraHeight: number;
  cameraTilt: number;
  flySpeed: number;
  moveSpeed: number;
  farClip: number;

  // Dynamic camera (acceleration-driven)
  dynTiltStrength: number;
  dynHeightStrength: number;
  dynZStrength: number;
  dynSmoothing: number;

  // Audio mappings
  audioAmplitude: AudioMapping;
  audioFrequency: AudioMapping;
  audioSpeed: AudioMapping;
  audioColor: AudioMapping;
  audioOctaves: AudioMapping;

  // Road setters
  setRoadEnabled: (v: boolean) => void;
  setRoadWidth: (v: number) => void;
  setRoadEdgeSoftness: (v: number) => void;
  setRoadColor: (v: string) => void;

  // Footpath setters
  setFootpathEnabled: (v: boolean) => void;
  setFootpathWidth: (v: number) => void;
  setFootpathGap: (v: number) => void;
  setFootpathEdgeSoftness: (v: number) => void;
  setFootpathColor: (v: string) => void;

  // Setters
  setNoiseType: (v: NoiseType) => void;
  setAmplitude: (v: number) => void;
  setFrequency: (v: number) => void;
  setSpeed: (v: number) => void;
  setOctaves: (v: number) => void;
  setLacunarity: (v: number) => void;
  setGain: (v: number) => void;
  setPointSize: (v: number) => void;
  setGridDensity: (v: number) => void;
  setColorLow: (v: string) => void;
  setColorMid: (v: string) => void;
  setColorHigh: (v: string) => void;
  setOpacity: (v: number) => void;
  setCameraHeight: (v: number) => void;
  setCameraTilt: (v: number) => void;
  setFlySpeed: (v: number) => void;
  setMoveSpeed: (v: number) => void;
  setFarClip: (v: number) => void;
  setDynTiltStrength: (v: number) => void;
  setDynHeightStrength: (v: number) => void;
  setDynZStrength: (v: number) => void;
  setDynSmoothing: (v: number) => void;
  setAudioAmplitude: (v: AudioMapping) => void;
  setAudioFrequency: (v: AudioMapping) => void;
  setAudioSpeed: (v: AudioMapping) => void;
  setAudioColor: (v: AudioMapping) => void;
  setAudioOctaves: (v: AudioMapping) => void;
}

export const useTerrainStore = create<TerrainState>()(
  persist(
    (set) => ({
      noiseType: "fbm",
      amplitude: 3.0,
      frequency: 0.15,
      speed: 1.0,

      octaves: 5,
      lacunarity: 2.0,
      gain: 0.5,

      roadEnabled: true,
      roadWidth: 4.0,
      roadEdgeSoftness: 0.4,
      roadColor: "#1a1a2e",

      footpathEnabled: true,
      footpathWidth: 0.8,
      footpathGap: 0.2,
      footpathEdgeSoftness: 0.2,
      footpathColor: "#2a2a3e",

      pointSize: 2.0,
      gridDensity: 256,
      colorLow: "#0a2463",
      colorMid: "#22d3ee",
      colorHigh: "#f0f0ff",
      opacity: 0.85,

      cameraHeight: 6.0,
      cameraTilt: -0.55,
      flySpeed: 2.0,
      moveSpeed: 10.0,
      farClip: 200,

      dynTiltStrength: 1.0,
      dynHeightStrength: 1.0,
      dynZStrength: 1.0,
      dynSmoothing: 4.0,

      audioAmplitude: { feature: "energy", sensitivity: 3.0 },
      audioFrequency: { feature: "none", sensitivity: 1.0 },
      audioSpeed: { feature: "none", sensitivity: 1.0 },
      audioColor: { feature: "none", sensitivity: 1.0 },
      audioOctaves: { feature: "none", sensitivity: 1.0 },

      setRoadEnabled: (v) => set({ roadEnabled: v }),
      setRoadWidth: (v) => set({ roadWidth: v }),
      setRoadEdgeSoftness: (v) => set({ roadEdgeSoftness: v }),
      setRoadColor: (v) => set({ roadColor: v }),

      setFootpathEnabled: (v) => set({ footpathEnabled: v }),
      setFootpathWidth: (v) => set({ footpathWidth: v }),
      setFootpathGap: (v) => set({ footpathGap: v }),
      setFootpathEdgeSoftness: (v) => set({ footpathEdgeSoftness: v }),
      setFootpathColor: (v) => set({ footpathColor: v }),

      setNoiseType: (v) => set({ noiseType: v }),
      setAmplitude: (v) => set({ amplitude: v }),
      setFrequency: (v) => set({ frequency: v }),
      setSpeed: (v) => set({ speed: v }),
      setOctaves: (v) => set({ octaves: v }),
      setLacunarity: (v) => set({ lacunarity: v }),
      setGain: (v) => set({ gain: v }),
      setPointSize: (v) => set({ pointSize: v }),
      setGridDensity: (v) => set({ gridDensity: v }),
      setColorLow: (v) => set({ colorLow: v }),
      setColorMid: (v) => set({ colorMid: v }),
      setColorHigh: (v) => set({ colorHigh: v }),
      setOpacity: (v) => set({ opacity: v }),
      setCameraHeight: (v) => set({ cameraHeight: v }),
      setCameraTilt: (v) => set({ cameraTilt: v }),
      setFlySpeed: (v) => set({ flySpeed: v }),
      setMoveSpeed: (v) => set({ moveSpeed: v }),
      setFarClip: (v) => set({ farClip: v }),
      setDynTiltStrength: (v) => set({ dynTiltStrength: v }),
      setDynHeightStrength: (v) => set({ dynHeightStrength: v }),
      setDynZStrength: (v) => set({ dynZStrength: v }),
      setDynSmoothing: (v) => set({ dynSmoothing: v }),
      setAudioAmplitude: (v) => set({ audioAmplitude: v }),
      setAudioFrequency: (v) => set({ audioFrequency: v }),
      setAudioSpeed: (v) => set({ audioSpeed: v }),
      setAudioColor: (v) => set({ audioColor: v }),
      setAudioOctaves: (v) => set({ audioOctaves: v }),
    }),
    { name: "pulse-terrain" }
  )
);
