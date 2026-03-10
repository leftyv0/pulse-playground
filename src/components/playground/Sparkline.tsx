import { memo } from "react";

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

export const Sparkline = memo(function Sparkline({
  data,
  color,
  width = 64,
  height = 16,
}: SparklineProps) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} className="flex-shrink-0">
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={color}
          strokeWidth={1}
          opacity={0.3}
        />
      </svg>
    );
  }

  // Filter out NaN/Infinity values
  const clean = data.map((v) => (Number.isFinite(v) ? v : 0));

  let min = clean[0];
  let max = clean[0];
  for (let i = 1; i < clean.length; i++) {
    if (clean[i] < min) min = clean[i];
    if (clean[i] > max) max = clean[i];
  }

  const range = max - min || 1;
  const padding = 1;
  const stepX = (width - 2 * padding) / (clean.length - 1);

  const points = clean
    .map((v, i) => {
      const x = padding + i * stepX;
      const y = height - padding - ((v - min) / range) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.8}
      />
    </svg>
  );
});
