"use client";

import { useRef, useEffect } from "react";
import { useControls, folder, LevaPanel, useCreateStore } from "leva";
import { usePostProcessingStore } from "@/store/postProcessingStore";

export function PostProcessingControlPanel() {
  const levaStore = useCreateStore();
  const skipSync = useRef(false);

  const initial = usePostProcessingStore.getState();

  useControls(
    () => ({
      // ── Bloom ──────────────────────────────────────────────
      Bloom: folder({
        "Bloom Amount": {
          value: initial.bloomAmount,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) usePostProcessingStore.getState().update({ bloomAmount: v });
          },
        },
        Intensity: {
          value: initial.bloomIntensity,
          min: 0,
          max: 20,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) usePostProcessingStore.getState().update({ bloomIntensity: v });
          },
        },
        Threshold: {
          value: initial.bloomThreshold,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) usePostProcessingStore.getState().update({ bloomThreshold: v });
          },
        },
        Smoothing: {
          value: initial.bloomSmoothing,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) usePostProcessingStore.getState().update({ bloomSmoothing: v });
          },
        },
        Levels: {
          value: initial.bloomLevels,
          min: 1,
          max: 16,
          step: 1,
          onChange: (v: number) => {
            if (!skipSync.current) usePostProcessingStore.getState().update({ bloomLevels: v });
          },
        },
        "Mipmap Blur": {
          value: initial.bloomMipmapBlur,
          onChange: (v: boolean) => {
            if (!skipSync.current) usePostProcessingStore.getState().update({ bloomMipmapBlur: v });
          },
        },
      }),

      // ── Brightness / Contrast ──────────────────────────────
      "Brightness / Contrast": folder(
        {
          "B/C Amount": {
            value: initial.brightnessContrastAmount,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ brightnessContrastAmount: v });
            },
          },
          Brightness: {
            value: initial.brightness,
            min: -1,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ brightness: v });
            },
          },
          Contrast: {
            value: initial.contrast,
            min: -1,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ contrast: v });
            },
          },
        },
        { collapsed: true }
      ),

      // ── Hue / Saturation ──────────────────────────────────
      "Hue / Saturation": folder(
        {
          "H/S Amount": {
            value: initial.hueSaturationAmount,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ hueSaturationAmount: v });
            },
          },
          Hue: {
            value: initial.hue,
            min: -Math.PI,
            max: Math.PI,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ hue: v });
            },
          },
          Saturation: {
            value: initial.saturation,
            min: -1,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ saturation: v });
            },
          },
        },
        { collapsed: true }
      ),

      // ── Tone Mapping ──────────────────────────────────────
      "Tone Mapping": folder({
        "ToneMap Amount": {
          value: initial.toneMappingAmount,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) usePostProcessingStore.getState().update({ toneMappingAmount: v });
          },
        },
        Mode: {
          value: initial.toneMappingMode,
          options: {
            Linear: 0,
            Reinhard: 1,
            "Reinhard 2": 2,
            "Reinhard 2 Adaptive": 3,
            Uncharted2: 4,
            "Optimized Cineon": 5,
            "ACES Filmic": 6,
            AGX: 7,
            Neutral: 8,
          },
          onChange: (v: number) => {
            if (!skipSync.current) usePostProcessingStore.getState().update({ toneMappingMode: v });
          },
        },
      }),

      // ── Chromatic Aberration ───────────────────────────────
      "Chromatic Aberration": folder(
        {
          "CA Amount": {
            value: initial.chromaticAberrationAmount,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ chromaticAberrationAmount: v });
            },
          },
          Offset: {
            value: initial.chromaticAberrationOffset,
            min: 0,
            max: 0.1,
            step: 0.001,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ chromaticAberrationOffset: v });
            },
          },
          "Radial Modulation": {
            value: initial.chromaticAberrationRadialModulation,
            onChange: (v: boolean) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ chromaticAberrationRadialModulation: v });
            },
          },
          "Modulation Offset": {
            value: initial.chromaticAberrationModulationOffset,
            min: 0,
            max: 2,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ chromaticAberrationModulationOffset: v });
            },
          },
        },
        { collapsed: true }
      ),

      // ── Vignette ──────────────────────────────────────────
      Vignette: folder({
        "Vignette Amount": {
          value: initial.vignetteAmount,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) usePostProcessingStore.getState().update({ vignetteAmount: v });
          },
        },
        "Vignette Offset": {
          value: initial.vignetteOffset,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) usePostProcessingStore.getState().update({ vignetteOffset: v });
          },
        },
        Darkness: {
          value: initial.vignetteDarkness,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) usePostProcessingStore.getState().update({ vignetteDarkness: v });
          },
        },
      }),

      // ── Depth of Field ────────────────────────────────────
      "Depth of Field": folder(
        {
          "DoF Amount": {
            value: initial.depthOfFieldAmount,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ depthOfFieldAmount: v });
            },
          },
          "Focus Distance": {
            value: initial.dofFocusDistance,
            min: 0,
            max: 1,
            step: 0.001,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ dofFocusDistance: v });
            },
          },
          "Focal Length": {
            value: initial.dofFocalLength,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ dofFocalLength: v });
            },
          },
          "Bokeh Scale": {
            value: initial.dofBokehScale,
            min: 0,
            max: 10,
            step: 0.1,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ dofBokehScale: v });
            },
          },
        },
        { collapsed: true }
      ),

      // ── Film Grain ────────────────────────────────────────
      "Film Grain": folder(
        {
          "Noise Amount": {
            value: initial.noiseAmount,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ noiseAmount: v });
            },
          },
          "Noise Opacity": {
            value: initial.noiseOpacity,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ noiseOpacity: v });
            },
          },
        },
        { collapsed: true }
      ),

      // ── Scanlines ─────────────────────────────────────────
      Scanlines: folder(
        {
          "Scanline Amount": {
            value: initial.scanlineAmount,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ scanlineAmount: v });
            },
          },
          Density: {
            value: initial.scanlineDensity,
            min: 0.1,
            max: 10,
            step: 0.1,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ scanlineDensity: v });
            },
          },
          "Scanline Opacity": {
            value: initial.scanlineOpacity,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ scanlineOpacity: v });
            },
          },
        },
        { collapsed: true }
      ),

      // ── Sepia ─────────────────────────────────────────────
      Sepia: folder(
        {
          "Sepia Amount": {
            value: initial.sepiaAmount,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ sepiaAmount: v });
            },
          },
          "Sepia Intensity": {
            value: initial.sepiaIntensity,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ sepiaIntensity: v });
            },
          },
        },
        { collapsed: true }
      ),

      // ── Glitch ────────────────────────────────────────────
      Glitch: folder(
        {
          "Glitch Amount": {
            value: initial.glitchAmount,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ glitchAmount: v });
            },
          },
          "Glitch Mode": {
            value: initial.glitchMode,
            options: {
              Sporadic: 1,
              "Constant Mild": 2,
              "Constant Wild": 3,
            },
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ glitchMode: v });
            },
          },
          "Strength Min": {
            value: initial.glitchStrengthMin,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ glitchStrengthMin: v });
            },
          },
          "Strength Max": {
            value: initial.glitchStrengthMax,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ glitchStrengthMax: v });
            },
          },
          "Duration Min": {
            value: initial.glitchDurationMin,
            min: 0,
            max: 2,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ glitchDurationMin: v });
            },
          },
          "Duration Max": {
            value: initial.glitchDurationMax,
            min: 0,
            max: 2,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ glitchDurationMax: v });
            },
          },
          "Delay Min": {
            value: initial.glitchDelayMin,
            min: 0,
            max: 10,
            step: 0.1,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ glitchDelayMin: v });
            },
          },
          "Delay Max": {
            value: initial.glitchDelayMax,
            min: 0,
            max: 10,
            step: 0.1,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ glitchDelayMax: v });
            },
          },
          Ratio: {
            value: initial.glitchRatio,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ glitchRatio: v });
            },
          },
        },
        { collapsed: true }
      ),

      // ── Pixelation ────────────────────────────────────────
      Pixelation: folder(
        {
          "Pixel Amount": {
            value: initial.pixelationAmount,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ pixelationAmount: v });
            },
          },
          Granularity: {
            value: initial.pixelationGranularity,
            min: 1,
            max: 100,
            step: 1,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ pixelationGranularity: v });
            },
          },
        },
        { collapsed: true }
      ),

      // ── Dot Screen ────────────────────────────────────────
      "Dot Screen": folder(
        {
          "DotScreen Amount": {
            value: initial.dotScreenAmount,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ dotScreenAmount: v });
            },
          },
          Angle: {
            value: initial.dotScreenAngle,
            min: 0,
            max: 6.28,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ dotScreenAngle: v });
            },
          },
          Scale: {
            value: initial.dotScreenScale,
            min: 0.1,
            max: 5,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ dotScreenScale: v });
            },
          },
        },
        { collapsed: true }
      ),

      // ── Color Depth ───────────────────────────────────────
      "Color Depth": folder(
        {
          "ColorDepth Amount": {
            value: initial.colorDepthAmount,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ colorDepthAmount: v });
            },
          },
          Bits: {
            value: initial.colorDepthBits,
            min: 1,
            max: 24,
            step: 1,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ colorDepthBits: v });
            },
          },
        },
        { collapsed: true }
      ),

      // ── SMAA ──────────────────────────────────────────────
      SMAA: folder(
        {
          "SMAA Amount": {
            value: initial.smaaAmount,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) usePostProcessingStore.getState().update({ smaaAmount: v });
            },
          },
        },
        { collapsed: true }
      ),
    }),
    { store: levaStore },
    []
  );

  // Zustand → Leva sync
  useEffect(
    () =>
      usePostProcessingStore.subscribe((state) => {
        skipSync.current = true;
        const values: Record<string, unknown> = {
          "Bloom.Bloom Amount": state.bloomAmount,
          "Bloom.Intensity": state.bloomIntensity,
          "Bloom.Threshold": state.bloomThreshold,
          "Bloom.Smoothing": state.bloomSmoothing,
          "Bloom.Levels": state.bloomLevels,
          "Bloom.Mipmap Blur": state.bloomMipmapBlur,

          "Brightness / Contrast.B/C Amount": state.brightnessContrastAmount,
          "Brightness / Contrast.Brightness": state.brightness,
          "Brightness / Contrast.Contrast": state.contrast,

          "Hue / Saturation.H/S Amount": state.hueSaturationAmount,
          "Hue / Saturation.Hue": state.hue,
          "Hue / Saturation.Saturation": state.saturation,

          "Tone Mapping.ToneMap Amount": state.toneMappingAmount,
          "Tone Mapping.Mode": state.toneMappingMode,

          "Chromatic Aberration.CA Amount": state.chromaticAberrationAmount,
          "Chromatic Aberration.Offset": state.chromaticAberrationOffset,
          "Chromatic Aberration.Radial Modulation": state.chromaticAberrationRadialModulation,
          "Chromatic Aberration.Modulation Offset": state.chromaticAberrationModulationOffset,

          "Vignette.Vignette Amount": state.vignetteAmount,
          "Vignette.Vignette Offset": state.vignetteOffset,
          "Vignette.Darkness": state.vignetteDarkness,

          "Depth of Field.DoF Amount": state.depthOfFieldAmount,
          "Depth of Field.Focus Distance": state.dofFocusDistance,
          "Depth of Field.Focal Length": state.dofFocalLength,
          "Depth of Field.Bokeh Scale": state.dofBokehScale,

          "Film Grain.Noise Amount": state.noiseAmount,
          "Film Grain.Noise Opacity": state.noiseOpacity,

          "Scanlines.Scanline Amount": state.scanlineAmount,
          "Scanlines.Density": state.scanlineDensity,
          "Scanlines.Scanline Opacity": state.scanlineOpacity,

          "Sepia.Sepia Amount": state.sepiaAmount,
          "Sepia.Sepia Intensity": state.sepiaIntensity,

          "Glitch.Glitch Amount": state.glitchAmount,
          "Glitch.Glitch Mode": state.glitchMode,
          "Glitch.Strength Min": state.glitchStrengthMin,
          "Glitch.Strength Max": state.glitchStrengthMax,
          "Glitch.Duration Min": state.glitchDurationMin,
          "Glitch.Duration Max": state.glitchDurationMax,
          "Glitch.Delay Min": state.glitchDelayMin,
          "Glitch.Delay Max": state.glitchDelayMax,
          "Glitch.Ratio": state.glitchRatio,

          "Pixelation.Pixel Amount": state.pixelationAmount,
          "Pixelation.Granularity": state.pixelationGranularity,

          "Dot Screen.DotScreen Amount": state.dotScreenAmount,
          "Dot Screen.Angle": state.dotScreenAngle,
          "Dot Screen.Scale": state.dotScreenScale,

          "Color Depth.ColorDepth Amount": state.colorDepthAmount,
          "Color Depth.Bits": state.colorDepthBits,

          "SMAA.SMAA Amount": state.smaaAmount,
        };
        for (const [key, value] of Object.entries(values)) {
          levaStore.setValueAtPath(key, value, false);
        }
        skipSync.current = false;
      }),
    [levaStore]
  );

  return (
    <div className="leva-scrollable">
      <LevaPanel
        store={levaStore}
        flat={false}
        titleBar={{ title: "Post Processing" }}
        fill
        theme={{
          colors: {
            elevation1: "#0a0a0f",
            elevation2: "#111118",
            elevation3: "#1a1a24",
            accent1: "#22d3ee",
            accent2: "#22d3ee",
            accent3: "#22d3ee",
            highlight1: "#ffffff",
            highlight2: "#b0b0b0",
            highlight3: "#808080",
          },
          fontSizes: { root: "10px" },
          sizes: { rootWidth: "280px", controlWidth: "140px" },
        }}
      />
    </div>
  );
}
