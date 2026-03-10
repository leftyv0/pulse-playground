"use client";

import { StatsPanel } from "@/components/playground/StatsPanel";
import { MusicPlayer } from "@/components/playground/MusicPlayer";
import { TerrainCanvas } from "@/components/playground/TerrainCanvas";
import { TerrainControlPanel } from "@/components/playground/TerrainControlPanel";
import { PostProcessingControlPanel } from "@/components/playground/PostProcessingControlPanel";

export default function PlaygroundPage() {
  return (
    <div className="relative w-screen h-screen bg-[var(--color-background)] overflow-hidden">
      <TerrainCanvas />
      <StatsPanel />
      <div className="absolute right-4 top-4 z-10 max-h-[calc(100vh-2rem)] overflow-y-auto flex flex-col gap-2">
        <TerrainControlPanel />
        <PostProcessingControlPanel />
      </div>
      <MusicPlayer />
    </div>
  );
}
