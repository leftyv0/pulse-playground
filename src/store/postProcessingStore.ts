"use client";

import { create, type StateCreator } from "zustand";
import { persist } from "zustand/middleware";

function debouncedPersist<T>(
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
  });
}

export interface PostProcessingState {
  // Bloom
  bloomAmount: number;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
  bloomLevels: number;
  bloomMipmapBlur: boolean;

  // Brightness / Contrast
  brightnessContrastAmount: number;
  brightness: number;
  contrast: number;

  // Chromatic Aberration
  chromaticAberrationAmount: number;
  chromaticAberrationOffset: number;
  chromaticAberrationRadialModulation: boolean;
  chromaticAberrationModulationOffset: number;

  // Color Depth
  colorDepthAmount: number;
  colorDepthBits: number;

  // Depth of Field
  depthOfFieldAmount: number;
  dofFocusDistance: number;
  dofFocalLength: number;
  dofBokehScale: number;

  // Dot Screen
  dotScreenAmount: number;
  dotScreenAngle: number;
  dotScreenScale: number;

  // Glitch
  glitchAmount: number;
  glitchStrengthMin: number;
  glitchStrengthMax: number;
  glitchDurationMin: number;
  glitchDurationMax: number;
  glitchDelayMin: number;
  glitchDelayMax: number;
  glitchRatio: number;
  glitchMode: number;

  // Hue / Saturation
  hueSaturationAmount: number;
  hue: number;
  saturation: number;

  // Noise (Film Grain)
  noiseAmount: number;
  noiseOpacity: number;

  // Pixelation
  pixelationAmount: number;
  pixelationGranularity: number;

  // Scanlines
  scanlineAmount: number;
  scanlineDensity: number;
  scanlineOpacity: number;

  // Sepia
  sepiaAmount: number;
  sepiaIntensity: number;

  // SMAA
  smaaAmount: number;

  // Tone Mapping
  toneMappingAmount: number;
  toneMappingMode: number;

  // Vignette
  vignetteAmount: number;
  vignetteOffset: number;
  vignetteDarkness: number;

  // Generic setter
  update: (values: Partial<PostProcessingState>) => void;
}

export const usePostProcessingStore = create<PostProcessingState>()(
  debouncedPersist(
    (set) => ({
      // Bloom
      bloomAmount: 1,
      bloomIntensity: 1.5,
      bloomThreshold: 0.6,
      bloomSmoothing: 0.4,
      bloomLevels: 8,
      bloomMipmapBlur: true,

      // Brightness / Contrast
      brightnessContrastAmount: 0,
      brightness: 0,
      contrast: 0,

      // Chromatic Aberration
      chromaticAberrationAmount: 0,
      chromaticAberrationOffset: 0.002,
      chromaticAberrationRadialModulation: false,
      chromaticAberrationModulationOffset: 0.5,

      // Color Depth
      colorDepthAmount: 0,
      colorDepthBits: 16,

      // Depth of Field
      depthOfFieldAmount: 0,
      dofFocusDistance: 0.02,
      dofFocalLength: 0.5,
      dofBokehScale: 3,

      // Dot Screen
      dotScreenAmount: 0,
      dotScreenAngle: 1.57,
      dotScreenScale: 1,

      // Glitch
      glitchAmount: 0,
      glitchStrengthMin: 0.1,
      glitchStrengthMax: 0.3,
      glitchDurationMin: 0.1,
      glitchDurationMax: 0.3,
      glitchDelayMin: 1.5,
      glitchDelayMax: 3.5,
      glitchRatio: 0.85,
      glitchMode: 1, // SPORADIC

      // Hue / Saturation
      hueSaturationAmount: 0,
      hue: 0,
      saturation: 0,

      // Noise (Film Grain)
      noiseAmount: 0,
      noiseOpacity: 0.15,

      // Pixelation
      pixelationAmount: 0,
      pixelationGranularity: 5,

      // Scanlines
      scanlineAmount: 0,
      scanlineDensity: 1.5,
      scanlineOpacity: 0.1,

      // Sepia
      sepiaAmount: 0,
      sepiaIntensity: 0.5,

      // SMAA
      smaaAmount: 0,

      // Tone Mapping
      toneMappingAmount: 1,
      toneMappingMode: 6, // ACES_FILMIC

      // Vignette
      vignetteAmount: 1,
      vignetteOffset: 0.3,
      vignetteDarkness: 0.9,

      update: (values) => set(values),
    }),
    { name: "pulse-postprocessing" }
  )
);
