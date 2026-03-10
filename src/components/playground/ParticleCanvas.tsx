"use client";

import { useEffect, useRef, useCallback } from "react";
import { useParticleStore } from "@/store/particleStore";
import { useAudioStore } from "@/store/audioStore";
import { useDrivingStore } from "@/store/drivingStore";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number; // unique offset for organic motion
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const cameraRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });
  const prevCountRef = useRef(0);

  // Sync particles array to match count
  const syncParticles = useCallback((count: number, spread: number) => {
    const current = particlesRef.current;
    if (current.length === count) return;

    if (current.length < count) {
      // Add new particles
      for (let i = current.length; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * spread;
        current.push({
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random(),
          phase: Math.random() * Math.PI * 2,
        });
      }
    } else {
      // Remove excess
      current.length = count;
    }
  }, []);

  // Pan handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY };
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      cameraRef.current.x += dx;
      cameraRef.current.y += dy;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
    };
    const onMouseUp = () => {
      dragRef.current.dragging = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let time = 0;

    const render = () => {
      // Read stores directly for perf (avoid re-renders)
      const store = useParticleStore.getState();
      const audio = useAudioStore.getState();

      const {
        minSize,
        maxSize,
        count,
        color,
        opacity,
        speed,
        spread,
        glow,
        glowIntensity,
        sizeReactsToAudio,
        speedReactsToAudio,
        colorReactsToAudio,
      } = store;

      const { energy, rms, bass, mid, treble } = audio;
      const driving = useDrivingStore.getState();
      const carSpeedFactor = driving.speedNormalized; // 0..1

      // Resize canvas to window
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Sync particle count
      syncParticles(count, spread);
      prevCountRef.current = count;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Camera offset (center of screen + pan)
      const cx = w / 2 + cameraRef.current.x;
      const cy = h / 2 + cameraRef.current.y;

      // Audio reactivity values (combined with car driving speed)
      const audioEnergy = Math.max(energy, rms);
      const drivingBoost = carSpeedFactor * 2; // driving adds up to 2× multiplier
      const sizeMultiplier = (sizeReactsToAudio ? 1 + audioEnergy * 3 : 1) + drivingBoost * 0.5;
      const speedMultiplier = (speedReactsToAudio ? 1 + audioEnergy * 4 : 1) + drivingBoost;

      // Color handling
      const [cr, cg, cb] = hexToRgb(color);

      // Glow setup
      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = glowIntensity * (sizeReactsToAudio ? 1 + audioEnergy * 2 : 1);
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      time += 0.016;

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Update position with organic drift + driving motion
        const drift = speed * speedMultiplier;
        // Particles stream downward (backward) proportional to car speed
        const drivingStreamY = carSpeedFactor * speed * 8;
        const lateralDrift = driving.lateralVelocity * speed * 0.3;
        p.x += p.vx * drift + Math.sin(time * 0.5 + p.phase) * drift * 0.3 - lateralDrift;
        p.y += p.vy * drift + Math.cos(time * 0.4 + p.phase) * drift * 0.3 + drivingStreamY;

        // Wrap around spread area
        const halfSpread = spread;
        if (p.x > halfSpread) p.x -= halfSpread * 2;
        if (p.x < -halfSpread) p.x += halfSpread * 2;
        if (p.y > halfSpread) p.y -= halfSpread * 2;
        if (p.y < -halfSpread) p.y += halfSpread * 2;

        // Screen position
        const sx = cx + p.x;
        const sy = cy + p.y;

        // Cull off-screen
        if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;

        // Size
        const baseSize = minSize + p.size * (maxSize - minSize);
        const finalSize = baseSize * sizeMultiplier;

        // Color with optional audio reactivity
        let r = cr,
          g = cg,
          b = cb;
        if (colorReactsToAudio) {
          // Shift hue based on bass/mid/treble balance
          r = Math.min(255, cr + bass * 100);
          g = Math.min(255, cg + mid * 80);
          b = Math.min(255, cb + treble * 100);
        }

        ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${opacity})`;
        drawCircle(ctx, sx, sy, finalSize);
      }

      // Reset shadow for next frame
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [syncParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ cursor: dragRef.current.dragging ? "grabbing" : "grab" }}
    />
  );
}
