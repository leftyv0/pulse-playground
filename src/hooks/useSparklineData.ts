"use client";

import { useEffect, useRef, useState } from "react";
import { getHistory, STAT_KEYS, type StatKey } from "@/lib/statsHistory";

type SparklineSnapshot = Record<StatKey, number[]>;

const EMPTY: SparklineSnapshot = Object.fromEntries(
  STAT_KEYS.map((k) => [k, [] as number[]])
) as unknown as SparklineSnapshot;

export function useSparklineData(): SparklineSnapshot {
  const [snapshot, setSnapshot] = useState<SparklineSnapshot>(EMPTY);
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    const FPS_INTERVAL = 1000 / 15; // ~15fps

    function tick(now: number) {
      rafRef.current = requestAnimationFrame(tick);
      if (now - lastRef.current < FPS_INTERVAL) return;
      lastRef.current = now;

      const next = {} as SparklineSnapshot;
      for (const key of STAT_KEYS) {
        next[key] = getHistory(key);
      }
      setSnapshot(next);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return snapshot;
}
