"use client";

import { useRef, useEffect } from "react";
import { useAudioStore } from "@/store/audioStore";

const WIDTH = 234;
const HEIGHT = 80;
const BAR_GAP = 1;

export function AudioHistogram() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const freq = useAudioStore.getState().frequencyData;
      const barCount = 64;
      const barWidth = (WIDTH - (barCount - 1) * BAR_GAP) / barCount;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      for (let i = 0; i < barCount; i++) {
        // Average pairs of bins for 64 bars from 128 bins
        const val = (freq[i * 2] + freq[i * 2 + 1]) / 2;
        const norm = val / 255;
        const barHeight = norm * HEIGHT;

        // Color gradient: cyan → magenta based on frequency position
        const hue = 180 + (i / barCount) * 120;
        const lightness = 45 + norm * 20;
        ctx.fillStyle = `hsla(${hue}, 80%, ${lightness}%, ${0.6 + norm * 0.4})`;

        ctx.fillRect(
          i * (barWidth + BAR_GAP),
          HEIGHT - barHeight,
          barWidth,
          barHeight
        );
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="mb-2">
      <div
        className="text-[9px] uppercase tracking-wider mb-1"
        style={{ color: "rgba(255, 255, 255, 0.25)" }}
      >
        Frequency Histogram
      </div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{
          width: WIDTH,
          height: HEIGHT,
          borderRadius: 4,
          background: "rgba(255, 255, 255, 0.03)",
        }}
      />
    </div>
  );
}
