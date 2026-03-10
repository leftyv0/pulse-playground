import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ParticleSettings {
  minSize: number;
  maxSize: number;
  count: number;
  color: string;
  opacity: number;
  speed: number;
  spread: number; // how far particles spread from center
  glow: boolean;
  glowIntensity: number;
  // audio reactivity toggles
  sizeReactsToAudio: boolean;
  speedReactsToAudio: boolean;
  colorReactsToAudio: boolean;
}

interface ParticleStore extends ParticleSettings {
  setMinSize: (size: number) => void;
  setMaxSize: (size: number) => void;
  setCount: (count: number) => void;
  setColor: (color: string) => void;
  setOpacity: (opacity: number) => void;
  setSpeed: (speed: number) => void;
  setSpread: (spread: number) => void;
  setGlow: (glow: boolean) => void;
  setGlowIntensity: (intensity: number) => void;
  setSizeReactsToAudio: (v: boolean) => void;
  setSpeedReactsToAudio: (v: boolean) => void;
  setColorReactsToAudio: (v: boolean) => void;
}

export const useParticleStore = create<ParticleStore>()(
  persist(
    (set) => ({
      minSize: 1,
      maxSize: 4,
      count: 800,
      color: "#22d3ee",
      opacity: 0.8,
      speed: 0.5,
      spread: 1500,
      glow: false,
      glowIntensity: 10,
      sizeReactsToAudio: true,
      speedReactsToAudio: true,
      colorReactsToAudio: false,

      setMinSize: (minSize) => set({ minSize }),
      setMaxSize: (maxSize) => set({ maxSize }),
      setCount: (count) => set({ count }),
      setColor: (color) => set({ color }),
      setOpacity: (opacity) => set({ opacity }),
      setSpeed: (speed) => set({ speed }),
      setSpread: (spread) => set({ spread }),
      setGlow: (glow) => set({ glow }),
      setGlowIntensity: (glowIntensity) => set({ glowIntensity }),
      setSizeReactsToAudio: (sizeReactsToAudio) => set({ sizeReactsToAudio }),
      setSpeedReactsToAudio: (speedReactsToAudio) => set({ speedReactsToAudio }),
      setColorReactsToAudio: (colorReactsToAudio) => set({ colorReactsToAudio }),
    }),
    { name: "pulse-particles" }
  )
);
