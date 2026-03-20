"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usePostProcessingStore } from "./postProcessingStore";

export type NoiseType = "perlin" | "simplex" | "fbm" | "ridged" | "voronoi";
export type TrailType = "solid" | "dashed" | "pulse" | "double";

/** All tunable values (no setters/functions) */
export interface TerrainPreset {
  noiseType: NoiseType;
  amplitude: number;
  frequency: number;
  speed: number;
  octaves: number;
  lacunarity: number;
  gain: number;
  pointSize: number;
  gridDensity: number;
  colorLow: string;
  colorMid: string;
  colorHigh: string;
  opacity: number;
  falloffStart: number;
  falloffEnd: number;
  pointSizeFalloff: number;
  nearFade: number;
  lateralFalloff: number;
  roadEnabled: boolean;
  roadWidth: number;
  roadEdgeSoftness: number;
  roadTerrainFalloff: number;
  roadColor: string;
  roadCurveAmplitude: number;
  roadCurveFrequency: number;
  roadPointSize: number;
  roadDensity: number;
  roadCrossDensity: number;
  roadFalloffStart: number;
  roadFalloffEnd: number;
  roadPointSizeFalloff: number;
  roadNearFade: number;
  footpathEnabled: boolean;
  footpathWidth: number;
  footpathGap: number;
  footpathEdgeSoftness: number;
  footpathColor: string;
  steerSensitivity: number;
  steerReturnSpeed: number;
  steerMaxLateralOffset: number;
  driftEnabled: boolean;
  driftGripLoss: number;
  driftSlipRate: number;
  driftRecovery: number;
  driftMaxAngle: number;
  driftLeanMultiplier: number;
  bodyLeanMax: number;
  bodyYawMax: number;
  bodyLeanSmoothing: number;
  bodyLeanReturnSmoothing: number;
  lateralRange: number;
  surgeDistance: number;
  surgeSmoothing: number;
  carMaterialColors: Record<string, string>;
  carEmissiveSettings: Record<string, { color: string; intensity: number }>;
  trailEnabled: boolean;
  trailColor: string;
  trailType: TrailType;
  trailWidth: number;
  trailLength: number;
  trailOpacity: number;
  trailGlow: number;
  trailFadeExponent: number;
  trailIdleOpacity: number;
  trailFrontEnabled: boolean;
  trailFrontColor: string;
  trailFrontWidth: number;
  trailFrontOpacity: number;
  trailFrontGlow: number;
  trailFrontFadeExponent: number;
  trailFrontLength: number;
  trailHeightOffset: number;
  cameraHeight: number;
  cameraTilt: number;
  flySpeed: number;
  moveSpeed: number;
  farClip: number;
  dynTiltStrength: number;
  dynHeightStrength: number;
  dynZStrength: number;
  dynSmoothing: number;

  // Post-processing
  bloomAmount: number;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
  bloomLevels: number;
  bloomMipmapBlur: boolean;
  brightnessContrastAmount: number;
  brightness: number;
  contrast: number;
  chromaticAberrationAmount: number;
  chromaticAberrationOffset: number;
  chromaticAberrationRadialModulation: boolean;
  chromaticAberrationModulationOffset: number;
  colorDepthAmount: number;
  colorDepthBits: number;
  depthOfFieldAmount: number;
  dofFocusDistance: number;
  dofFocalLength: number;
  dofBokehScale: number;
  dotScreenAmount: number;
  dotScreenAngle: number;
  dotScreenScale: number;
  glitchAmount: number;
  glitchStrengthMin: number;
  glitchStrengthMax: number;
  glitchDurationMin: number;
  glitchDurationMax: number;
  glitchDelayMin: number;
  glitchDelayMax: number;
  glitchRatio: number;
  glitchMode: number;
  hueSaturationAmount: number;
  hue: number;
  saturation: number;
  noiseAmount: number;
  noiseOpacity: number;
  pixelationAmount: number;
  pixelationGranularity: number;
  scanlineAmount: number;
  scanlineDensity: number;
  scanlineOpacity: number;
  sepiaAmount: number;
  sepiaIntensity: number;
  smaaAmount: number;
  toneMappingAmount: number;
  toneMappingMode: number;
  vignetteAmount: number;
  vignetteOffset: number;
  vignetteDarkness: number;
}

export const DEFAULT_PRESET: TerrainPreset = {
  noiseType: "fbm",
  amplitude: 7.2,
  frequency: 0.01,
  speed: 2.0,
  octaves: 5,
  lacunarity: 4.0,
  gain: 0.34,
  pointSize: 0.5,
  gridDensity: 640,
  falloffStart: 0.05,
  falloffEnd: 0.5,
  pointSizeFalloff: 1.0,
  nearFade: 0,
  lateralFalloff: 1.55,
  colorLow: "#00ffd0",
  colorMid: "#00a2ff",
  colorHigh: "#b70190",
  opacity: 1.0,
  roadEnabled: true,
  roadWidth: 10,
  roadEdgeSoftness: 0,
  roadTerrainFalloff: 20,
  roadColor: "#585858",
  roadCurveAmplitude: 6.5,
  roadCurveFrequency: 0.01,
  roadPointSize: 0.5,
  roadDensity: 512,
  roadCrossDensity: 24,
  roadFalloffStart: 0,
  roadFalloffEnd: 0.5,
  roadPointSizeFalloff: 1.0,
  roadNearFade: 0,
  footpathEnabled: true,
  footpathWidth: 1.8,
  footpathGap: 0,
  footpathEdgeSoftness: 0,
  footpathColor: "#ffffff",
  steerSensitivity: 6.0,
  steerReturnSpeed: 0.3,
  steerMaxLateralOffset: 4.4,
  driftEnabled: true,
  driftGripLoss: 0.5,
  driftSlipRate: 1.5,
  driftRecovery: 3,
  driftMaxAngle: 0.2,
  driftLeanMultiplier: 1.0,
  bodyLeanMax: 0.03,
  bodyYawMax: 0.04,
  bodyLeanSmoothing: 8,
  bodyLeanReturnSmoothing: 6,
  lateralRange: 0.5,
  surgeDistance: 7.0,
  surgeSmoothing: 3.0,
  carMaterialColors: {
    "Body Paint": "#383838",
    "Chassis": "#ffffff",
    "Glass": "#ffffff",
    "Grille": "#ffffff",
    "Headlight Housing": "#ffffff",
    "Headlight Refractor": "#ffffff",
    "Rear Refractor": "#ffffff",
    "Taillight Glass": "#ffffff",
    "Indicator Glass": "#ffffff",
    "Interior": "#ffffff",
    "Screen": "#ffffff",
    "Matte Black": "#808080",
    "Glossy Black": "#ffffff",
    "Chrome": "#ffffff",
    "Badges": "#ffffff",
    "Wheel Rims": "#ffffff",
    "Tyres": "#d8cfcf",
    "Brake Rotors": "#ffffff",
  },
  carEmissiveSettings: {
    "Headlight Housing": { color: "#ffffee", intensity: 2.0 },
    "Headlight Refractor": { color: "#ffffee", intensity: 1.5 },
    "Taillight Glass": { color: "#ff6434", intensity: 10.0 },
    "Indicator Glass": { color: "#ffffff", intensity: 10.0 },
    "Rear Refractor": { color: "#ff1122", intensity: 1.0 },
  },
  trailEnabled: true,
  trailColor: "#ff6434",
  trailType: "double",
  trailWidth: 0.03,
  trailLength: 130,
  trailOpacity: 1.0,
  trailGlow: 2.0,
  trailFadeExponent: 5.0,
  trailIdleOpacity: 0.02,
  trailFrontEnabled: false,
  trailFrontColor: "#ff6434",
  trailFrontWidth: 0.05,
  trailFrontOpacity: 1.0,
  trailFrontGlow: 2.0,
  trailFrontFadeExponent: 5.0,
  trailFrontLength: 130,
  trailHeightOffset: 0.01,
  cameraHeight: 2.5,
  cameraTilt: -0.2,
  flySpeed: 4.5,
  moveSpeed: 48.0,
  farClip: 640,
  dynTiltStrength: 1.7,
  dynHeightStrength: 0,
  dynZStrength: 0.9,
  dynSmoothing: 4.0,

  // Post-processing
  bloomAmount: 0.52,
  bloomIntensity: 7.3,
  bloomThreshold: 0.1,
  bloomSmoothing: 0.52,
  bloomLevels: 9,
  bloomMipmapBlur: true,
  brightnessContrastAmount: 0.33,
  brightness: 0.01,
  contrast: 0.13,
  chromaticAberrationAmount: 0,
  chromaticAberrationOffset: 0.041,
  chromaticAberrationRadialModulation: false,
  chromaticAberrationModulationOffset: 0.66,
  colorDepthAmount: 0,
  colorDepthBits: 24,
  depthOfFieldAmount: 0,
  dofFocusDistance: 0.232,
  dofFocalLength: 0.17,
  dofBokehScale: 4.5,
  dotScreenAmount: 0,
  dotScreenAngle: 4.23,
  dotScreenScale: 5,
  glitchAmount: 0,
  glitchStrengthMin: 0.1,
  glitchStrengthMax: 0.3,
  glitchDurationMin: 0.1,
  glitchDurationMax: 0.3,
  glitchDelayMin: 1.5,
  glitchDelayMax: 3.5,
  glitchRatio: 0.85,
  glitchMode: 2,
  hueSaturationAmount: 0,
  hue: 0,
  saturation: 0,
  noiseAmount: 0,
  noiseOpacity: 0.55,
  pixelationAmount: 0,
  pixelationGranularity: 100,
  scanlineAmount: 0,
  scanlineDensity: 0.9,
  scanlineOpacity: 0.35,
  sepiaAmount: 0,
  sepiaIntensity: 0.5,
  smaaAmount: 0,
  toneMappingAmount: 1,
  toneMappingMode: 4,
  vignetteAmount: 1,
  vignetteOffset: 0.31,
  vignetteDarkness: 0.63,
};

/** Keys of TerrainPreset — used to extract preset data from full state */
const PRESET_KEYS = Object.keys(DEFAULT_PRESET) as (keyof TerrainPreset)[];

/** Post-processing keys within the preset */
const PP_KEYS = [
  "bloomAmount", "bloomIntensity", "bloomThreshold", "bloomSmoothing", "bloomLevels", "bloomMipmapBlur",
  "brightnessContrastAmount", "brightness", "contrast",
  "chromaticAberrationAmount", "chromaticAberrationOffset", "chromaticAberrationRadialModulation", "chromaticAberrationModulationOffset",
  "colorDepthAmount", "colorDepthBits",
  "depthOfFieldAmount", "dofFocusDistance", "dofFocalLength", "dofBokehScale",
  "dotScreenAmount", "dotScreenAngle", "dotScreenScale",
  "glitchAmount", "glitchStrengthMin", "glitchStrengthMax", "glitchDurationMin", "glitchDurationMax",
  "glitchDelayMin", "glitchDelayMax", "glitchRatio", "glitchMode",
  "hueSaturationAmount", "hue", "saturation",
  "noiseAmount", "noiseOpacity",
  "pixelationAmount", "pixelationGranularity",
  "scanlineAmount", "scanlineDensity", "scanlineOpacity",
  "sepiaAmount", "sepiaIntensity",
  "smaaAmount",
  "toneMappingAmount", "toneMappingMode",
  "vignetteAmount", "vignetteOffset", "vignetteDarkness",
] as const;

export function extractPreset(state: TerrainState): TerrainPreset {
  const preset = {} as Record<string, unknown>;
  for (const key of PRESET_KEYS) {
    const val = state[key];
    // Deep-copy objects so presets are independent snapshots
    preset[key] = val && typeof val === "object" ? JSON.parse(JSON.stringify(val)) : val;
  }
  return preset as unknown as TerrainPreset;
}

export interface TerrainState extends TerrainPreset {
  // Preset management
  presets: Record<string, TerrainPreset>;
  activePreset: string;
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
  resetToDefault: () => void;

  // Car material/emissive setters
  setCarMaterialColor: (label: string, color: string) => void;
  setCarEmissiveColor: (label: string, color: string) => void;
  setCarEmissiveIntensity: (label: string, intensity: number) => void;

  // Road setters
  setRoadEnabled: (v: boolean) => void;
  setRoadWidth: (v: number) => void;
  setRoadEdgeSoftness: (v: number) => void;
  setRoadTerrainFalloff: (v: number) => void;
  setRoadColor: (v: string) => void;
  setRoadCurveAmplitude: (v: number) => void;
  setRoadCurveFrequency: (v: number) => void;
  setRoadPointSize: (v: number) => void;
  setRoadDensity: (v: number) => void;
  setRoadCrossDensity: (v: number) => void;
  setRoadFalloffStart: (v: number) => void;
  setRoadFalloffEnd: (v: number) => void;
  setRoadPointSizeFalloff: (v: number) => void;
  setRoadNearFade: (v: number) => void;

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
  setBodyLeanMax: (v: number) => void;
  setBodyYawMax: (v: number) => void;
  setBodyLeanSmoothing: (v: number) => void;
  setBodyLeanReturnSmoothing: (v: number) => void;
  setLateralRange: (v: number) => void;
  setSurgeDistance: (v: number) => void;
  setSurgeSmoothing: (v: number) => void;

  // Trail setters
  setTrailEnabled: (v: boolean) => void;
  setTrailColor: (v: string) => void;
  setTrailType: (v: TrailType) => void;
  setTrailWidth: (v: number) => void;
  setTrailLength: (v: number) => void;
  setTrailOpacity: (v: number) => void;
  setTrailGlow: (v: number) => void;
  setTrailFadeExponent: (v: number) => void;
  setTrailIdleOpacity: (v: number) => void;

  // Front trail setters
  setTrailFrontEnabled: (v: boolean) => void;
  setTrailFrontColor: (v: string) => void;
  setTrailFrontWidth: (v: number) => void;
  setTrailFrontOpacity: (v: number) => void;
  setTrailFrontGlow: (v: number) => void;
  setTrailFrontFadeExponent: (v: number) => void;
  setTrailFrontLength: (v: number) => void;
  setTrailHeightOffset: (v: number) => void;

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
}

export const useTerrainStore = create<TerrainState>()(
  persist(
    (set, get) => ({
      ...JSON.parse(JSON.stringify(DEFAULT_PRESET)),

      // Preset management
      presets: {} as Record<string, TerrainPreset>,
      activePreset: "Default",

      savePreset: (name: string) => {
        // Capture post-processing state into terrain store before extracting
        const ppState = usePostProcessingStore.getState();
        const ppSnapshot: Partial<TerrainPreset> = {};
        for (const key of PP_KEYS) {
          (ppSnapshot as Record<string, unknown>)[key] = ppState[key as keyof typeof ppState];
        }
        set(ppSnapshot);
        const preset = extractPreset(get());
        set((s) => ({
          presets: { ...s.presets, [name]: preset },
          activePreset: name,
        }));
      },

      loadPreset: (name: string) => {
        if (name === "Default") {
          get().resetToDefault();
          return;
        }
        const preset = get().presets[name];
        if (preset) {
          const parsed = JSON.parse(JSON.stringify(preset));
          set({ ...parsed, activePreset: name });
          // Sync post-processing values to pp store
          const ppUpdate: Record<string, unknown> = {};
          for (const key of PP_KEYS) {
            if (key in parsed) ppUpdate[key] = parsed[key];
          }
          if (Object.keys(ppUpdate).length > 0) {
            usePostProcessingStore.getState().update(ppUpdate);
          }
        }
      },

      deletePreset: (name: string) => {
        if (name === "Default") return;
        set((s) => {
          const { [name]: _, ...rest } = s.presets;
          const isActive = s.activePreset === name;
          return {
            presets: rest,
            activePreset: isActive ? "Default" : s.activePreset,
            ...(isActive ? JSON.parse(JSON.stringify(DEFAULT_PRESET)) : {}),
          };
        });
        if (get().activePreset === "Default") {
          // Also reset pp store to defaults
          const ppDefaults: Record<string, unknown> = {};
          for (const key of PP_KEYS) {
            ppDefaults[key] = DEFAULT_PRESET[key as keyof TerrainPreset];
          }
          usePostProcessingStore.getState().update(ppDefaults);
        }
      },

      resetToDefault: () => {
        set({ ...JSON.parse(JSON.stringify(DEFAULT_PRESET)), activePreset: "Default" });
        // Also reset pp store to defaults
        const ppDefaults: Record<string, unknown> = {};
        for (const key of PP_KEYS) {
          ppDefaults[key] = DEFAULT_PRESET[key as keyof TerrainPreset];
        }
        usePostProcessingStore.getState().update(ppDefaults);
      },

      setRoadEnabled: (v) => set({ roadEnabled: v }),
      setRoadWidth: (v) => set({ roadWidth: v }),
      setRoadEdgeSoftness: (v) => set({ roadEdgeSoftness: v }),
      setRoadTerrainFalloff: (v) => set({ roadTerrainFalloff: v }),
      setRoadColor: (v) => set({ roadColor: v }),
      setRoadCurveAmplitude: (v) => set({ roadCurveAmplitude: v }),
      setRoadCurveFrequency: (v) => set({ roadCurveFrequency: v }),
      setRoadPointSize: (v) => set({ roadPointSize: v }),
      setRoadDensity: (v) => set({ roadDensity: v }),
      setRoadCrossDensity: (v) => set({ roadCrossDensity: v }),
      setRoadFalloffStart: (v) => set({ roadFalloffStart: v }),
      setRoadFalloffEnd: (v) => set({ roadFalloffEnd: v }),
      setRoadPointSizeFalloff: (v) => set({ roadPointSizeFalloff: v }),
      setRoadNearFade: (v) => set({ roadNearFade: v }),
      setSteerSensitivity: (v) => set({ steerSensitivity: v }),
      setSteerReturnSpeed: (v) => set({ steerReturnSpeed: v }),
      setSteerMaxLateralOffset: (v) => set({ steerMaxLateralOffset: v }),
      setDriftEnabled: (v) => set({ driftEnabled: v }),
      setDriftGripLoss: (v) => set({ driftGripLoss: v }),
      setDriftSlipRate: (v) => set({ driftSlipRate: v }),
      setDriftRecovery: (v) => set({ driftRecovery: v }),
      setDriftMaxAngle: (v) => set({ driftMaxAngle: v }),
      setDriftLeanMultiplier: (v) => set({ driftLeanMultiplier: v }),
      setBodyLeanMax: (v) => set({ bodyLeanMax: v }),
      setBodyYawMax: (v) => set({ bodyYawMax: v }),
      setBodyLeanSmoothing: (v) => set({ bodyLeanSmoothing: v }),
      setBodyLeanReturnSmoothing: (v) => set({ bodyLeanReturnSmoothing: v }),
      setLateralRange: (v) => set({ lateralRange: v }),
      setSurgeDistance: (v) => set({ surgeDistance: v }),
      setSurgeSmoothing: (v) => set({ surgeSmoothing: v }),

      setCarMaterialColor: (label, color) =>
        set((s) => ({
          carMaterialColors: { ...s.carMaterialColors, [label]: color },
        })),
      setCarEmissiveColor: (label, color) =>
        set((s) => ({
          carEmissiveSettings: {
            ...s.carEmissiveSettings,
            [label]: { ...s.carEmissiveSettings[label], color },
          },
        })),
      setCarEmissiveIntensity: (label, intensity) =>
        set((s) => ({
          carEmissiveSettings: {
            ...s.carEmissiveSettings,
            [label]: { ...s.carEmissiveSettings[label], intensity },
          },
        })),

      setTrailEnabled: (v) => set({ trailEnabled: v }),
      setTrailColor: (v) => set({ trailColor: v }),
      setTrailType: (v) => set({ trailType: v as TrailType }),
      setTrailWidth: (v) => set({ trailWidth: v }),
      setTrailLength: (v) => set({ trailLength: v }),
      setTrailOpacity: (v) => set({ trailOpacity: v }),
      setTrailGlow: (v) => set({ trailGlow: v }),
      setTrailFadeExponent: (v) => set({ trailFadeExponent: v }),
      setTrailIdleOpacity: (v) => set({ trailIdleOpacity: v }),

      setTrailFrontEnabled: (v) => set({ trailFrontEnabled: v }),
      setTrailFrontColor: (v) => set({ trailFrontColor: v }),
      setTrailFrontWidth: (v) => set({ trailFrontWidth: v }),
      setTrailFrontOpacity: (v) => set({ trailFrontOpacity: v }),
      setTrailFrontGlow: (v) => set({ trailFrontGlow: v }),
      setTrailFrontFadeExponent: (v) => set({ trailFrontFadeExponent: v }),
      setTrailFrontLength: (v) => set({ trailFrontLength: v }),
      setTrailHeightOffset: (v) => set({ trailHeightOffset: v }),

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
    }),
    { name: "pulse-terrain" }
  )
);
