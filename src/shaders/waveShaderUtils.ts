/**
 * Generates GLSL uniform declarations for wave slots.
 * Total slots = 3 channels × slotsPerChannel.
 * Color/emissive uniforms remain per-channel (3 total).
 */
export function generateWaveUniforms(slotsPerChannel: number): string {
  const totalSlots = 3 * slotsPerChannel;
  const lines: string[] = [];

  for (let i = 0; i < totalSlots; i++) {
    lines.push(`uniform vec3  uWaveOrigin${i};`);
    lines.push(`uniform float uWaveProgress${i};`);
    lines.push(`uniform float uWaveMaxRadius${i};`);
    lines.push(`uniform float uWaveRingWidth${i};`);
    lines.push(`uniform float uWaveWidthFade${i};`);
    lines.push(`uniform float uWaveHeight${i};`);
    lines.push(`uniform float uWaveActive${i};`);
    lines.push(`uniform float uWaveFadeExp${i};`);
    lines.push(`uniform float uWaveFadeStart${i};`);
    lines.push(`uniform float uWaveLifeFrac${i};`);
    lines.push(`uniform float uWaveRingShape${i};`);
    if (i < totalSlots - 1) lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generates GLSL displacement code for all wave slots.
 * Slots within the same channel accumulate into one per-channel varying (vWaveMask0/1/2).
 */
export function generateWaveBlocks(slotsPerChannel: number): string {
  const lines: string[] = [];

  // Init per-channel accumulators
  for (let ch = 0; ch < 3; ch++) {
    lines.push(`  float waveMaskAccum${ch} = 0.0;`);
  }
  lines.push("");

  // Generate displacement code per slot
  for (let ch = 0; ch < 3; ch++) {
    for (let s = 0; s < slotsPerChannel; s++) {
      const idx = ch * slotsPerChannel + s;
      lines.push(`  {`);
      lines.push(`    float dist${idx} = distance(pos.xz, uWaveOrigin${idx}.xz);`);
      lines.push(`    float currentRadius${idx} = uWaveProgress${idx} * uWaveMaxRadius${idx};`);
      lines.push(`    float ringDist${idx} = abs(dist${idx} - currentRadius${idx});`);
      lines.push(`    float effWidth${idx} = uWaveRingWidth${idx} * mix(1.0, 1.0 - uWaveProgress${idx}, uWaveWidthFade${idx});`);
      // Bell curve blend: smoothstep ↔ Gaussian
      lines.push(`    float sigma${idx} = max(effWidth${idx} * 0.4, 0.001);`);
      lines.push(`    float gaussMask${idx} = exp(-0.5 * (ringDist${idx} * ringDist${idx}) / (sigma${idx} * sigma${idx}));`);
      lines.push(`    float stepMask${idx} = 1.0 - smoothstep(0.0, max(effWidth${idx}, 0.001), ringDist${idx});`);
      lines.push(`    float ringMask${idx} = mix(stepMask${idx}, gaussMask${idx}, uWaveRingShape${idx});`);
      lines.push(`    ringMask${idx} *= uWaveActive${idx};`);
      lines.push(`    float fadeProgress${idx} = smoothstep(uWaveFadeStart${idx}, 1.0, uWaveLifeFrac${idx});`);
      lines.push(`    float fade${idx} = pow(1.0 - fadeProgress${idx}, uWaveFadeExp${idx});`);
      lines.push(`    pos.y += ringMask${idx} * fade${idx} * uWaveHeight${idx};`);
      lines.push(`    waveMaskAccum${ch} += ringMask${idx} * fade${idx};`);
      lines.push(`  }`);
    }
  }

  lines.push("");
  // Assign clamped accumulators to varyings
  for (let ch = 0; ch < 3; ch++) {
    lines.push(`  vWaveMask${ch} = clamp(waveMaskAccum${ch}, 0.0, 1.0);`);
  }

  return lines.join("\n");
}
