// Circular buffer for sparkline history — zero-allocation writes at ~86Hz

const BUFFER_SIZE = 64;

const STAT_KEYS = [
  "bass",
  "mid",
  "treble",
  "energy",
  "rms",
  "spectralCentroid",
  "spectralFlux",
  "spectralFlatness",
  "perceptualSharpness",
  "zcr",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

const buffers: Record<string, Float64Array> = {};
let writeIndex = 0;
let count = 0;

for (const key of STAT_KEYS) {
  buffers[key] = new Float64Array(BUFFER_SIZE);
}

export function pushStats(stats: Record<StatKey, number>) {
  for (const key of STAT_KEYS) {
    buffers[key][writeIndex] = stats[key];
  }
  writeIndex = (writeIndex + 1) % BUFFER_SIZE;
  if (count < BUFFER_SIZE) count++;
}

export function getHistory(key: StatKey): number[] {
  const len = Math.min(count, BUFFER_SIZE);
  const result = new Array<number>(len);
  const buf = buffers[key];
  for (let i = 0; i < len; i++) {
    result[i] = buf[(writeIndex - len + i + BUFFER_SIZE) % BUFFER_SIZE];
  }
  return result;
}

export { STAT_KEYS };
