"use client";

import { useAudioStore } from "@/store/audioStore";
import { Sparkline } from "./Sparkline";
import { AudioHistogram } from "./AudioHistogram";
import { useSparklineData } from "@/hooks/useSparklineData";
import type { StatKey } from "@/lib/statsHistory";

export function StatsPanel() {
  const bass = useAudioStore((s) => s.bass);
  const mid = useAudioStore((s) => s.mid);
  const treble = useAudioStore((s) => s.treble);
  const volume = useAudioStore((s) => s.volume);
  const energy = useAudioStore((s) => s.energy);
  const rms = useAudioStore((s) => s.rms);
  const zcr = useAudioStore((s) => s.zcr);
  const spectralCentroid = useAudioStore((s) => s.spectralCentroid);
  const spectralCrest = useAudioStore((s) => s.spectralCrest);
  const spectralFlatness = useAudioStore((s) => s.spectralFlatness);
  const spectralFlux = useAudioStore((s) => s.spectralFlux);
  const spectralKurtosis = useAudioStore((s) => s.spectralKurtosis);
  const spectralRolloff = useAudioStore((s) => s.spectralRolloff);
  const spectralSkewness = useAudioStore((s) => s.spectralSkewness);
  const spectralSlope = useAudioStore((s) => s.spectralSlope);
  const spectralSpread = useAudioStore((s) => s.spectralSpread);
  const perceptualSharpness = useAudioStore((s) => s.perceptualSharpness);
  const perceptualSpread = useAudioStore((s) => s.perceptualSpread);
  const loudnessTotal = useAudioStore((s) => s.loudnessTotal);

  const sparklines = useSparklineData();

  const bandStats: { label: string; key?: StatKey; value: string; color: string }[] = [
    { label: "Bass", key: "bass", value: (bass * 100).toFixed(0), color: "var(--color-error)" },
    { label: "Mid", key: "mid", value: (mid * 100).toFixed(0), color: "var(--color-success)" },
    { label: "Treble", key: "treble", value: (treble * 100).toFixed(0), color: "var(--color-accent)" },
    { label: "Volume", value: (volume * 100).toFixed(0), color: "var(--color-warning, orange)" },
  ];

  const coreStats: { label: string; key?: StatKey; value: string; color: string }[] = [
    { label: "Energy", key: "energy", value: energy.toFixed(2), color: "var(--color-warning, orange)" },
    { label: "RMS", key: "rms", value: (rms * 100).toFixed(0), color: "var(--color-info, #60a5fa)" },
    { label: "ZCR", key: "zcr", value: zcr.toFixed(0), color: "var(--color-success)" },
    { label: "Loudness", value: loudnessTotal.toFixed(1), color: "var(--color-error)" },
  ];

  const spectralStats: { label: string; key?: StatKey; value: string; color: string }[] = [
    { label: "Centroid", key: "spectralCentroid", value: spectralCentroid.toFixed(0), color: "var(--color-info, #60a5fa)" },
    { label: "Crest", value: spectralCrest.toFixed(2), color: "var(--color-accent)" },
    { label: "Flatness", key: "spectralFlatness", value: spectralFlatness.toFixed(3), color: "#e879f9" },
    { label: "Flux", key: "spectralFlux", value: spectralFlux.toFixed(1), color: "#c084fc" },
    { label: "Kurtosis", value: spectralKurtosis.toFixed(2), color: "var(--color-warning, orange)" },
    { label: "Rolloff", value: spectralRolloff.toFixed(0), color: "var(--color-info, #60a5fa)" },
    { label: "Skewness", value: spectralSkewness.toFixed(2), color: "var(--color-success)" },
    { label: "Slope", value: spectralSlope.toFixed(4), color: "var(--color-accent)" },
    { label: "Spread", value: spectralSpread.toFixed(1), color: "var(--color-secondary, #a78bfa)" },
  ];

  const perceptualStats: { label: string; key?: StatKey; value: string; color: string }[] = [
    { label: "Sharpness", key: "perceptualSharpness", value: perceptualSharpness.toFixed(2), color: "var(--color-accent)" },
    { label: "P. Spread", value: perceptualSpread.toFixed(3), color: "var(--color-secondary, #a78bfa)" },
  ];

  const sections = [
    { title: "Bands", stats: bandStats },
    { title: "Core", stats: coreStats },
    { title: "Spectral", stats: spectralStats },
    { title: "Perceptual", stats: perceptualStats },
  ];

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-auto">
      <div
        className="rounded-lg p-3 font-mono text-xs min-w-[260px] max-h-[80vh] overflow-y-auto"
        style={{
          background: "#0a0a0f",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div
          className="text-[10px] font-semibold uppercase tracking-widest mb-2 pb-1"
          style={{
            color: "rgba(255, 255, 255, 0.4)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          Meyda Stats
        </div>
        <AudioHistogram />
        {sections.map((section) => (
          <div key={section.title} className="mb-2">
            <div
              className="text-[9px] uppercase tracking-wider mb-1"
              style={{ color: "rgba(255, 255, 255, 0.25)" }}
            >
              {section.title}
            </div>
            <div className="flex flex-col gap-1">
              {section.stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between gap-2">
                  <span className="w-[60px] flex-shrink-0" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                    {stat.label}
                  </span>
                  {stat.key ? (
                    <Sparkline data={sparklines[stat.key]} color={stat.color} />
                  ) : (
                    <div className="w-[64px] flex-shrink-0" />
                  )}
                  <span style={{ color: stat.color }} className="tabular-nums text-right w-[50px] flex-shrink-0">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
