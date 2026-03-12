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
      bloomAmount: 0.52,
      bloomIntensity: 7.3,
      bloomThreshold: 0.1,
      bloomSmoothing: 0.52,
      bloomLevels: 9,
      bloomMipmapBlur: true,

      // Brightness / Contrast
      brightnessContrastAmount: 0.33,
      brightness: 0.01,
      contrast: 0.13,

      // Chromatic Aberration
      chromaticAberrationAmount: 0,
      chromaticAberrationOffset: 0.041,
      chromaticAberrationRadialModulation: false,
      chromaticAberrationModulationOffset: 0.66,

      // Color Depth
      colorDepthAmount: 0,
      colorDepthBits: 24,

      // Depth of Field
      depthOfFieldAmount: 0,
      dofFocusDistance: 0.232,
      dofFocalLength: 0.17,
      dofBokehScale: 4.5,

      // Dot Screen
      dotScreenAmount: 0,
      dotScreenAngle: 4.23,
      dotScreenScale: 5,

      // Glitch
      glitchAmount: 0,
      glitchStrengthMin: 0.1,
      glitchStrengthMax: 0.3,
      glitchDurationMin: 0.1,
      glitchDurationMax: 0.3,
      glitchDelayMin: 1.5,
      glitchDelayMax: 3.5,
      glitchRatio: 0.85,
      glitchMode: 2, // CONSTANT_MILD

      // Hue / Saturation
      hueSaturationAmount: 0,
      hue: 0,
      saturation: 0,

      // Noise (Film Grain)
      noiseAmount: 0,
      noiseOpacity: 0.55,

      // Pixelation
      pixelationAmount: 0,
      pixelationGranularity: 100,

      // Scanlines
      scanlineAmount: 0,
      scanlineDensity: 0.9,
      scanlineOpacity: 0.35,

      // Sepia
      sepiaAmount: 0,
      sepiaIntensity: 0.5,

      // SMAA
      smaaAmount: 0,

      // Tone Mapping
      toneMappingAmount: 1,
      toneMappingMode: 4, // UNCHARTED2

      // Vignette
      vignetteAmount: 1,
      vignetteOffset: 0.31,
      vignetteDarkness: 0.63,

      update: (values) => set(values),
    }),
    { name: "pulse-postprocessing" }
  )
);
