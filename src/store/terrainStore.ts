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

  // Fall-off
  falloffStart: number;
  falloffEnd: number;
  pointSizeFalloff: number;
  nearFade: number;
  lateralFalloff: number;

  // Road
  roadEnabled: boolean;
  roadWidth: number;
  roadEdgeSoftness: number;
  roadColor: string;
  roadCurveAmplitude: number;
  roadCurveFrequency: number;
  roadPointSize: number;
  roadDensity: number;

  // Footpaths
  footpathEnabled: boolean;
  footpathWidth: number;
  footpathGap: number;
  footpathEdgeSoftness: number;
  footpathColor: string;

  // Steering
  steerSensitivity: number;
  steerReturnSpeed: number;
  steerMaxLateralOffset: number;

  // Drift
  driftEnabled: boolean;
  driftGripLoss: number;
  driftSlipRate: number;
  driftRecovery: number;
  driftMaxAngle: number;
  driftLeanMultiplier: number;

  // Lateral range — how far the car travels when steering
  lateralRange: number;

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
  setRoadCurveAmplitude: (v: number) => void;
  setRoadCurveFrequency: (v: number) => void;
  setRoadPointSize: (v: number) => void;
  setRoadDensity: (v: number) => void;

  // Steering setters
  setSteerSensitivity: (v: number) => void;
  setSteerReturnSpeed: (v: number) => void;
  setSteerMaxLateralOffset: (v: number) => void;

  // Drift setters
  setDriftEnabled: (v: boolean) => void;
  setDriftGripLoss: (v: number) => void;
  setDriftSlipRate: (v: number) => void;
  setDriftRecovery: (v: number) => void;
  setDriftMaxAngle: (v: number) => void;
  setDriftLeanMultiplier: (v: number) => void;
  setLateralRange: (v: number) => void;

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
  setFalloffStart: (v: number) => void;
  setFalloffEnd: (v: number) => void;
  setPointSizeFalloff: (v: number) => void;
  setNearFade: (v: number) => void;
  setLateralFalloff: (v: number) => void;
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
      amplitude: 7.2,
      frequency: 0.01,
      speed: 2.0,

      octaves: 5,
      lacunarity: 4.0,
      gain: 0.34,

      roadEnabled: true,
      roadWidth: 13.5,
      roadEdgeSoftness: 0,
      roadColor: "#585858",
      roadCurveAmplitude: 4.0,
      roadCurveFrequency: 0.01,
      roadPointSize: 0.5,
      roadDensity: 360,

      footpathEnabled: true,
      footpathWidth: 1.8,
      footpathGap: 0,
      footpathEdgeSoftness: 0,
      footpathColor: "#ffffff",

      steerSensitivity: 8.0,
      steerReturnSpeed: 0.5,
      steerMaxLateralOffset: 4.4,

      driftEnabled: true,
      driftGripLoss: 0.55,
      driftSlipRate: 4.25,
      driftRecovery: 8.0,
      driftMaxAngle: 0.5,
      driftLeanMultiplier: 0.5,
      lateralRange: 0.9,

      pointSize: 0.3,
      gridDensity: 640,
      falloffStart: 0.05,
      falloffEnd: 0.5,
      pointSizeFalloff: 1.0,
      nearFade: 0,
      lateralFalloff: 1.55,
      colorLow: "#00ffd0",
      colorMid: "#00a2ff",
      colorHigh: "#ff0c00",
      opacity: 0.75,

      cameraHeight: 3.5,
      cameraTilt: -0.2,
      flySpeed: 9.5,
      moveSpeed: 48.0,
      farClip: 510,

      dynTiltStrength: 1.8,
      dynHeightStrength: 1.7,
      dynZStrength: 0,
      dynSmoothing: 1.0,

      audioAmplitude: { feature: "energy", sensitivity: 1.3 },
      audioFrequency: { feature: "none", sensitivity: 0 },
      audioSpeed: { feature: "none", sensitivity: 0 },
      audioColor: { feature: "none", sensitivity: 0 },
      audioOctaves: { feature: "none", sensitivity: 0 },

      setRoadEnabled: (v) => set({ roadEnabled: v }),
      setRoadWidth: (v) => set({ roadWidth: v }),
      setRoadEdgeSoftness: (v) => set({ roadEdgeSoftness: v }),
      setRoadColor: (v) => set({ roadColor: v }),
      setRoadCurveAmplitude: (v) => set({ roadCurveAmplitude: v }),
      setRoadCurveFrequency: (v) => set({ roadCurveFrequency: v }),
      setRoadPointSize: (v) => set({ roadPointSize: v }),
      setRoadDensity: (v) => set({ roadDensity: v }),
      setSteerSensitivity: (v) => set({ steerSensitivity: v }),
      setSteerReturnSpeed: (v) => set({ steerReturnSpeed: v }),
      setSteerMaxLateralOffset: (v) => set({ steerMaxLateralOffset: v }),
      setDriftEnabled: (v) => set({ driftEnabled: v }),
      setDriftGripLoss: (v) => set({ driftGripLoss: v }),
      setDriftSlipRate: (v) => set({ driftSlipRate: v }),
      setDriftRecovery: (v) => set({ driftRecovery: v }),
      setDriftMaxAngle: (v) => set({ driftMaxAngle: v }),
      setDriftLeanMultiplier: (v) => set({ driftLeanMultiplier: v }),
      setLateralRange: (v) => set({ lateralRange: v }),

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
      setFalloffStart: (v) => set({ falloffStart: v }),
      setFalloffEnd: (v) => set({ falloffEnd: v }),
      setPointSizeFalloff: (v) => set({ pointSizeFalloff: v }),
      setNearFade: (v) => set({ nearFade: v }),
      setLateralFalloff: (v) => set({ lateralFalloff: v }),
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
