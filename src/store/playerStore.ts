import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerStore {
  volume: number;
  selectedTrackUrl: string;
  selectedTrackName: string;
  shuffle: boolean;
  repeat: "off" | "one" | "all";

  setVolume: (volume: number) => void;
  setSelectedTrack: (url: string, name: string) => void;
  setShuffle: (shuffle: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      volume: 1,
      selectedTrackUrl: "",
      selectedTrackName: "",
      shuffle: false,
      repeat: "off" as const,

      setVolume: (volume) => set({ volume }),
      setSelectedTrack: (url, name) =>
        set({ selectedTrackUrl: url, selectedTrackName: name }),
      setShuffle: (shuffle) => set({ shuffle }),
      toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
      cycleRepeat: () =>
        set((s) => ({
          repeat:
            s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
        })),
    }),
    {
      name: "pulse-player",
    }
  )
);
