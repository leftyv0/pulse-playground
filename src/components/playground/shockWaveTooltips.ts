import type { TooltipDef } from "./ControlTooltip";
import { useShockWaveStore, type WaveSettings } from "@/store/shockWaveStore";

/* ── Field map: label suffix → WaveSettings key ── */

const FIELD_MAP: Record<string, keyof WaveSettings> = {
  Enabled: "enabled",
  Color: "color",
  "Emissive Boost": "emissiveBoost",
  "Max Radius": "maxRadius",
  "Ring Width": "ringWidth",
  "Width Fade": "ringWidthFade",
  Height: "heightDisplacement",
  Speed: "speed",
  Lifetime: "lifetime",
  "Audio Feature": "audioFeature",
  Reactivity: "audioSensitivity",
  Threshold: "triggerThreshold",
  "Fade Exponent": "fadeExponent",
  "Fade Start": "fadeStart",
  "Ring Shape": "ringShape",
};

/* ── Build tooltip map for all 3 waves ── */

function buildTooltipMap(): Record<string, TooltipDef> {
  const WAVE_DEFAULTS = [
    { enabled: "true", color: "#22d3ee", feature: "energy" },
    { enabled: "false", color: "#ff66ff", feature: "bass" },
    { enabled: "false", color: "#ffaa00", feature: "spectralFlux" },
  ];

  const map: Record<string, TooltipDef> = {};

  for (let i = 0; i < 3; i++) {
    const n = i + 1;
    const wd = WAVE_DEFAULTS[i];

    map[`W${n} Enabled`] = {
      title: `W${n} Enabled`,
      description: "Activates this shock wave channel. When off, no displacement or color tinting is computed for this wave.",
      type: "boolean", default: wd.enabled, affects: "Wave computation & rendering",
    };
    map[`W${n} Color`] = {
      title: `W${n} Color`,
      description: "Tint color applied to particles displaced by the wave ring. Combined with emissive boost for HDR bloom pickup.",
      type: "color (hex)", default: wd.color, format: "hexadecimal",
    };
    map[`W${n} Emissive Boost`] = {
      title: `W${n} Emissive Boost`,
      description: "Multiplier on wave color intensity. Values above 1.0 push brightness into HDR range for bloom glow.",
      type: "float", default: "3.0", min: 0, max: 10, step: 0.1, affects: "Bloom intensity",
    };
    map[`W${n} Max Radius`] = {
      title: `W${n} Max Radius`,
      description: "Maximum expansion distance of the ring before the wave resets and waits for the next audio trigger.",
      type: "float", default: "4.0", min: 1, max: 15, step: 0.1,
    };
    map[`W${n} Ring Width`] = {
      title: `W${n} Ring Width`,
      description: "Thickness of the displacement band. Small values create a sharp line, large values a broad wash of lifted particles.",
      type: "float", default: "0.5", min: 0.1, max: 3.0, step: 0.05,
    };
    map[`W${n} Width Fade`] = {
      title: `W${n} Width Fade`,
      description: "How much the ring narrows as it expands. 0 = constant width, 1 = tapers to a thin line at full radius.",
      type: "float", default: "0.5", min: 0, max: 1, step: 0.05,
    };
    map[`W${n} Height`] = {
      title: `W${n} Height`,
      description: "Maximum Y-axis lift of particles inside the ring. Larger values create more dramatic vertical ripples.",
      type: "float", default: "1.0", min: 0.1, max: 5.0, step: 0.1,
    };
    map[`W${n} Speed`] = {
      title: `W${n} Speed`,
      description: "Rate at which the ring expands outward from the car. Controls pulse tempo independently of audio trigger rate.",
      type: "float", default: "1.0", min: 0.5, max: 8.0, step: 0.1,
    };
    map[`W${n} Lifetime`] = {
      title: `W${n} Lifetime`,
      description: "How long the pulse stays in the scene (in seconds) before fading out completely. The ring expands based on Speed, then lingers at full radius until lifetime expires. Longer values allow more overlapping pulses.",
      type: "float", default: "2.0", min: 0.5, max: 8.0, step: 0.1, affects: "Pulse duration & overlap",
    };
    map[`W${n} Audio Feature`] = {
      title: `W${n} Audio Feature`,
      description: "Which audio analysis signal triggers new pulses. Energy/RMS respond to volume; bass/mid/treble to frequency bands; spectral features measure tonal shape; perceptual features model human hearing.",
      type: "enum", default: wd.feature, options: 18, scope: "Audio analysis pipeline",
    };
    map[`W${n} Reactivity`] = {
      title: `W${n} Reactivity`,
      description: "Shapes the normalized audio response curve. At 1.0 (default) the raw normalized value is used directly. Above 1.0 makes triggers fire more easily on subtle signals; below 1.0 requires stronger signals to fire.",
      type: "float", default: "1.0", min: 0.25, max: 4, step: 0.05, affects: "Audio response curve",
    };
    map[`W${n} Threshold`] = {
      title: `W${n} Threshold`,
      description: "Normalized audio level (0–1) that must be exceeded to fire a pulse. The audio signal is auto-normalized based on its recent range, so this value works consistently across all features.",
      type: "float", default: "0.3", min: 0, max: 1, step: 0.01, affects: "Pulse trigger frequency",
    };
    map[`W${n} Fade Exponent`] = {
      title: `W${n} Fade Exponent`,
      description: "Shape of the falloff curve. 1.0 = linear, 2.0 = smooth quadratic, higher = holds brightness then cuts sharply.",
      type: "float", default: "1.5", min: 0.5, max: 5.0, step: 0.1,
    };
    map[`W${n} Fade Start`] = {
      title: `W${n} Fade Start`,
      description: "Expansion progress at which fade begins. 0 = immediate fade, higher = full intensity longer before dimming.",
      type: "float", default: "0.3", min: 0, max: 0.9, step: 0.01,
    };
    map[`W${n} Ring Shape`] = {
      title: `W${n} Ring Shape`,
      description: "Blends between hard-edged smoothstep (0) and smooth Gaussian bell curve (1). Higher values create softer, more natural ring edges.",
      type: "float", default: "0.7", min: 0, max: 1, step: 0.05,
    };
  }

  return map;
}

export const SHOCK_WAVE_TOOLTIPS: Record<string, TooltipDef> = buildTooltipMap();

export function getShockWaveValue(key: string): unknown {
  const match = key.match(/^W(\d)\s+(.+)$/);
  if (!match) return undefined;
  const waveIndex = parseInt(match[1], 10) - 1;
  const field = FIELD_MAP[match[2]];
  if (field === undefined) return undefined;
  return useShockWaveStore.getState().waves[waveIndex][field];
}
