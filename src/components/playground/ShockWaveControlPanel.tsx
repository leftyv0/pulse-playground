"use client";

import { useRef, useEffect } from "react";
import { useControls, folder, LevaPanel, useCreateStore } from "leva";
import {
  useShockWaveStore,
  type AudioFeature,
} from "@/store/shockWaveStore";
import { useControlTooltips, ControlTooltipPortal } from "./ControlTooltip";
import { SHOCK_WAVE_TOOLTIPS, getShockWaveValue } from "./shockWaveTooltips";

const AUDIO_FEATURE_OPTIONS = {
  Energy: "energy",
  RMS: "rms",
  Bass: "bass",
  Mid: "mid",
  Treble: "treble",
  "Loudness Total": "loudnessTotal",
  "Spectral Flux": "spectralFlux",
  "Spectral Centroid": "spectralCentroid",
  "Spectral Crest": "spectralCrest",
  "Spectral Flatness": "spectralFlatness",
  "Spectral Kurtosis": "spectralKurtosis",
  "Spectral Rolloff": "spectralRolloff",
  "Spectral Skewness": "spectralSkewness",
  "Spectral Slope": "spectralSlope",
  "Spectral Spread": "spectralSpread",
  ZCR: "zcr",
  "Perceptual Sharpness": "perceptualSharpness",
  "Perceptual Spread": "perceptualSpread",
} as const;

function buildWaveControls(
  index: number,
  skipSync: React.MutableRefObject<boolean>
) {
  const n = index + 1; // 1-based label
  const w = useShockWaveStore.getState().waves[index];
  const update = (partial: Record<string, unknown>) =>
    useShockWaveStore.getState().updateWave(index, partial);

  return {
    [`W${n} Enabled`]: {
      value: w.enabled,
      onChange: (v: boolean) => {
        if (!skipSync.current) update({ enabled: v });
      },
    },
    [`W${n} Color`]: {
      value: w.color,
      onChange: (v: string) => {
        if (!skipSync.current) update({ color: v });
      },
    },
    [`W${n} Emissive Boost`]: {
      value: w.emissiveBoost,
      min: 0,
      max: 10,
      step: 0.1,
      onChange: (v: number) => {
        if (!skipSync.current) update({ emissiveBoost: v });
      },
    },
    [`W${n} Max Radius`]: {
      value: w.maxRadius,
      min: 0.5,
      max: 20,
      step: 0.05,
      onChange: (v: number) => {
        if (!skipSync.current) update({ maxRadius: v });
      },
    },
    [`W${n} Ring Width`]: {
      value: w.ringWidth,
      min: 0.01,
      max: 5.0,
      step: 0.01,
      onChange: (v: number) => {
        if (!skipSync.current) update({ ringWidth: v });
      },
    },
    [`W${n} Width Fade`]: {
      value: w.ringWidthFade,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v: number) => {
        if (!skipSync.current) update({ ringWidthFade: v });
      },
    },
    [`W${n} Height`]: {
      value: w.heightDisplacement,
      min: 0.1,
      max: 5.0,
      step: 0.1,
      onChange: (v: number) => {
        if (!skipSync.current) update({ heightDisplacement: v });
      },
    },
    [`W${n} Speed`]: {
      value: w.speed,
      min: 0.5,
      max: 8.0,
      step: 0.1,
      onChange: (v: number) => {
        if (!skipSync.current) update({ speed: v });
      },
    },
    [`W${n} Lifetime`]: {
      value: w.lifetime ?? 2.0,
      min: 0.5,
      max: 8.0,
      step: 0.1,
      onChange: (v: number) => {
        if (!skipSync.current) update({ lifetime: v });
      },
    },
    [`W${n} Audio Feature`]: {
      value: w.audioFeature,
      options: AUDIO_FEATURE_OPTIONS,
      onChange: (v: AudioFeature) => {
        if (!skipSync.current) update({ audioFeature: v });
      },
    },
    [`W${n} Reactivity`]: {
      value: w.audioSensitivity,
      min: 0.25,
      max: 4,
      step: 0.05,
      onChange: (v: number) => {
        if (!skipSync.current) update({ audioSensitivity: v });
      },
    },
    [`W${n} Threshold`]: {
      value: w.triggerThreshold,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v: number) => {
        if (!skipSync.current) update({ triggerThreshold: v });
      },
    },
    [`W${n} Fade Exponent`]: {
      value: w.fadeExponent,
      min: 0.1,
      max: 8.0,
      step: 0.05,
      onChange: (v: number) => {
        if (!skipSync.current) update({ fadeExponent: v });
      },
    },
    [`W${n} Fade Start`]: {
      value: w.fadeStart,
      min: 0,
      max: 0.95,
      step: 0.005,
      onChange: (v: number) => {
        if (!skipSync.current) update({ fadeStart: v });
      },
    },
    [`W${n} Ring Shape`]: {
      value: w.ringShape ?? 0.7,
      min: 0,
      max: 1,
      step: 0.05,
      onChange: (v: number) => {
        if (!skipSync.current) update({ ringShape: v });
      },
    },
  };
}

export function ShockWaveControlPanel() {
  const levaStore = useCreateStore();
  const skipSync = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const activeTooltip = useControlTooltips(panelRef, SHOCK_WAVE_TOOLTIPS);

  useControls(
    () => ({
      "Wave 1": folder(buildWaveControls(0, skipSync), { collapsed: true }),
      "Wave 2": folder(buildWaveControls(1, skipSync), { collapsed: true }),
      "Wave 3": folder(buildWaveControls(2, skipSync), { collapsed: true }),
    }),
    { store: levaStore },
    []
  );

  // Zustand → Leva sync
  useEffect(
    () =>
      useShockWaveStore.subscribe((state) => {
        skipSync.current = true;
        const values: Record<string, unknown> = {};
        for (let i = 0; i < 3; i++) {
          const w = state.waves[i];
          const f = `Wave ${i + 1}`;
          const n = i + 1;
          values[`${f}.W${n} Enabled`] = w.enabled;
          values[`${f}.W${n} Color`] = w.color;
          values[`${f}.W${n} Emissive Boost`] = w.emissiveBoost;
          values[`${f}.W${n} Max Radius`] = w.maxRadius;
          values[`${f}.W${n} Ring Width`] = w.ringWidth;
          values[`${f}.W${n} Width Fade`] = w.ringWidthFade ?? 0.5;
          values[`${f}.W${n} Height`] = w.heightDisplacement;
          values[`${f}.W${n} Speed`] = w.speed;
          values[`${f}.W${n} Lifetime`] = w.lifetime ?? 2.0;
          values[`${f}.W${n} Audio Feature`] = w.audioFeature;
          values[`${f}.W${n} Reactivity`] = w.audioSensitivity;
          values[`${f}.W${n} Threshold`] = w.triggerThreshold;
          values[`${f}.W${n} Fade Exponent`] = w.fadeExponent;
          values[`${f}.W${n} Fade Start`] = w.fadeStart;
          values[`${f}.W${n} Ring Shape`] = w.ringShape ?? 0.7;
        }
        for (const [key, value] of Object.entries(values)) {
          levaStore.setValueAtPath(key, value, false);
        }
        skipSync.current = false;
      }),
    [levaStore]
  );

  return (
    <div className="leva-scrollable" ref={panelRef}>
      <LevaPanel
        store={levaStore}
        flat={false}
        titleBar={{ title: "Shock Waves" }}
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
      {activeTooltip && <ControlTooltipPortal tooltip={activeTooltip} getValue={getShockWaveValue} />}
    </div>
  );
}
