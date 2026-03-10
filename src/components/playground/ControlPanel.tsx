"use client";

import { useParticleStore } from "@/store/particleStore";
import {
  useControls,
  folder,
  LevaPanel,
  useCreateStore,
} from "leva";
import { useEffect, useRef } from "react";


export function ControlPanel() {
  const levaStore = useCreateStore();
  const skipSync = useRef(false);

  const initial = useParticleStore.getState();

  useControls(
    () => ({
      Color: {
        value: initial.color,
        onChange: (v: string) => {
          if (!skipSync.current) useParticleStore.getState().setColor(v);
        },
      },
      Appearance: folder({
        Count: {
          value: initial.count,
          min: 50,
          max: 3000,
          step: 50,
          onChange: (v: number) => {
            if (!skipSync.current) useParticleStore.getState().setCount(v);
          },
        },
        "Min Size": {
          value: initial.minSize,
          min: 0.5,
          max: 10,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) useParticleStore.getState().setMinSize(v);
          },
        },
        "Max Size": {
          value: initial.maxSize,
          min: 1,
          max: 20,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) useParticleStore.getState().setMaxSize(v);
          },
        },
        Opacity: {
          value: initial.opacity,
          min: 0.05,
          max: 1,
          step: 0.05,
          onChange: (v: number) => {
            if (!skipSync.current) useParticleStore.getState().setOpacity(v);
          },
        },
      }),
      Motion: folder({
        Speed: {
          value: initial.speed,
          min: 0,
          max: 3,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) useParticleStore.getState().setSpeed(v);
          },
        },
        Spread: {
          value: initial.spread,
          min: 200,
          max: 5000,
          step: 100,
          onChange: (v: number) => {
            if (!skipSync.current) useParticleStore.getState().setSpread(v);
          },
        },
      }),
      Glow: folder({
        "Enable Glow": {
          value: initial.glow,
          onChange: (v: boolean) => {
            if (!skipSync.current) useParticleStore.getState().setGlow(v);
          },
        },
        "Glow Intensity": {
          value: initial.glowIntensity,
          min: 2,
          max: 30,
          step: 1,
          onChange: (v: number) => {
            if (!skipSync.current)
              useParticleStore.getState().setGlowIntensity(v);
          },
        },
      }),
      "Audio Reactivity": folder({
        "Size reacts to audio": {
          value: initial.sizeReactsToAudio,
          onChange: (v: boolean) => {
            if (!skipSync.current)
              useParticleStore.getState().setSizeReactsToAudio(v);
          },
        },
        "Speed reacts to audio": {
          value: initial.speedReactsToAudio,
          onChange: (v: boolean) => {
            if (!skipSync.current)
              useParticleStore.getState().setSpeedReactsToAudio(v);
          },
        },
        "Color reacts to audio": {
          value: initial.colorReactsToAudio,
          onChange: (v: boolean) => {
            if (!skipSync.current)
              useParticleStore.getState().setColorReactsToAudio(v);
          },
        },
      }),
    }),
    { store: levaStore },
    []
  );

  // Sync Zustand → leva when store changes externally
  useEffect(
    () =>
      useParticleStore.subscribe((state) => {
        skipSync.current = true;
        const values: Record<string, unknown> = {
          Color: state.color,
          "Appearance.Count": state.count,
          "Appearance.Min Size": state.minSize,
          "Appearance.Max Size": state.maxSize,
          "Appearance.Opacity": state.opacity,
          "Motion.Speed": state.speed,
          "Motion.Spread": state.spread,
          "Glow.Enable Glow": state.glow,
          "Glow.Glow Intensity": state.glowIntensity,
          "Audio Reactivity.Size reacts to audio": state.sizeReactsToAudio,
          "Audio Reactivity.Speed reacts to audio": state.speedReactsToAudio,
          "Audio Reactivity.Color reacts to audio": state.colorReactsToAudio,
        };
        for (const [key, value] of Object.entries(values)) {
          levaStore.setValueAtPath(key, value, false);
        }
        skipSync.current = false;
      }),
    [levaStore]
  );

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-auto max-h-[80vh] overflow-y-auto rounded-lg leva-scrollable">
      <LevaPanel
        store={levaStore}
        flat={false}
        titleBar={{ title: "Particles" }}
        fill
        theme={{
          colors: {
            elevation1: "#0a0a0f",
            elevation2: "#111118",
            elevation3: "#1a1a24",
            accent1: "#22d3ee",
            accent2: "#22d3ee",
            accent3: "#22d3ee",
            highlight1: "rgba(255,255,255,0.5)",
            highlight2: "rgba(255,255,255,0.7)",
            highlight3: "#fff",
          },
          fontSizes: {
            root: "10px",
          },
          sizes: {
            rootWidth: "240px",
            controlWidth: "120px",
          },
        }}
      />
    </div>
  );
}
