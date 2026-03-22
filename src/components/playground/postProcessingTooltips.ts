import type { TooltipDef } from "./ControlTooltip";
import { usePostProcessingStore, type PostProcessingState } from "@/store/postProcessingStore";

/* ── Label → store field mapping ── */

const FIELD_MAP: Record<string, keyof PostProcessingState> = {
  // Bloom
  "Bloom Amount": "bloomAmount",
  Intensity: "bloomIntensity",
  Threshold: "bloomThreshold",
  Smoothing: "bloomSmoothing",
  Levels: "bloomLevels",
  "Mipmap Blur": "bloomMipmapBlur",
  // Brightness / Contrast
  "B/C Amount": "brightnessContrastAmount",
  Brightness: "brightness",
  Contrast: "contrast",
  // Hue / Saturation
  "H/S Amount": "hueSaturationAmount",
  Hue: "hue",
  Saturation: "saturation",
  // Tone Mapping
  "ToneMap Amount": "toneMappingAmount",
  Mode: "toneMappingMode",
  // Chromatic Aberration
  "CA Amount": "chromaticAberrationAmount",
  Offset: "chromaticAberrationOffset",
  "Radial Modulation": "chromaticAberrationRadialModulation",
  "Modulation Offset": "chromaticAberrationModulationOffset",
  // Vignette
  "Vignette Amount": "vignetteAmount",
  "Vignette Offset": "vignetteOffset",
  Darkness: "vignetteDarkness",
  // Depth of Field
  "DoF Amount": "depthOfFieldAmount",
  "Focus Distance": "dofFocusDistance",
  "Focal Length": "dofFocalLength",
  "Bokeh Scale": "dofBokehScale",
  // Film Grain
  "Noise Amount": "noiseAmount",
  "Noise Opacity": "noiseOpacity",
  // Scanlines
  "Scanline Amount": "scanlineAmount",
  Density: "scanlineDensity",
  "Scanline Opacity": "scanlineOpacity",
  // Sepia
  "Sepia Amount": "sepiaAmount",
  "Sepia Intensity": "sepiaIntensity",
  // Glitch
  "Glitch Amount": "glitchAmount",
  "Glitch Mode": "glitchMode",
  "Strength Min": "glitchStrengthMin",
  "Strength Max": "glitchStrengthMax",
  "Duration Min": "glitchDurationMin",
  "Duration Max": "glitchDurationMax",
  "Delay Min": "glitchDelayMin",
  "Delay Max": "glitchDelayMax",
  Ratio: "glitchRatio",
  // Pixelation
  "Pixel Amount": "pixelationAmount",
  Granularity: "pixelationGranularity",
  // Dot Screen
  "DotScreen Amount": "dotScreenAmount",
  Angle: "dotScreenAngle",
  Scale: "dotScreenScale",
  // Color Depth
  "ColorDepth Amount": "colorDepthAmount",
  Bits: "colorDepthBits",
  // SMAA
  "SMAA Amount": "smaaAmount",
};

/* ── Tooltip definitions ── */

export const POST_PROCESSING_TOOLTIPS: Record<string, TooltipDef> = {
  // ── Bloom ──
  "Bloom Amount": {
    title: "Bloom Amount",
    description: "Mix factor for the bloom effect. 0 = off, 1 = full bloom.",
    type: "float", default: "0.52", min: 0, max: 1, step: 0.01, scope: "Bloom pass",
  },
  Intensity: {
    title: "Bloom Intensity",
    description: "Strength of the bloom glow. Higher values create more dramatic light bleeding.",
    type: "float", default: "7.3", min: 0, max: 20, step: 0.1,
  },
  Threshold: {
    title: "Bloom Threshold",
    description: "Brightness cutoff for bloom. Only pixels above this value contribute to glow.",
    type: "float", default: "0.1", min: 0, max: 1, step: 0.01,
  },
  Smoothing: {
    title: "Bloom Smoothing",
    description: "Smooth transition at the threshold edge. Higher values produce more gradual falloff.",
    type: "float", default: "0.52", min: 0, max: 1, step: 0.01,
  },
  Levels: {
    title: "Bloom Levels",
    description: "Number of blur passes. More levels create wider, softer bloom at higher GPU cost.",
    type: "integer", default: "9", min: 1, max: 16, step: 1, affects: "GPU performance",
  },
  "Mipmap Blur": {
    title: "Mipmap Blur",
    description: "Uses mipmap chain for blur computation. Produces higher quality bloom at minimal extra cost.",
    type: "boolean", default: "true",
  },

  // ── Brightness / Contrast ──
  "B/C Amount": {
    title: "B/C Amount",
    description: "Mix factor for the brightness/contrast effect.",
    type: "float", default: "0.33", min: 0, max: 1, step: 0.01, scope: "Color correction pass",
  },
  Brightness: {
    title: "Brightness",
    description: "Overall image brightness offset. Positive = brighter, negative = darker.",
    type: "float", default: "0.01", min: -1, max: 1, step: 0.01,
  },
  Contrast: {
    title: "Contrast",
    description: "Contrast adjustment. Positive = more contrast, negative = washed out.",
    type: "float", default: "0.13", min: -1, max: 1, step: 0.01,
  },

  // ── Hue / Saturation ──
  "H/S Amount": {
    title: "H/S Amount",
    description: "Mix factor for hue/saturation adjustment.",
    type: "float", default: "0", min: 0, max: 1, step: 0.01, scope: "Color correction pass",
  },
  Hue: {
    title: "Hue",
    description: "Hue rotation in radians. Shifts all colors around the color wheel.",
    type: "float", default: "0", min: -3.14, max: 3.14, step: 0.01,
  },
  Saturation: {
    title: "Saturation",
    description: "Color intensity. Negative = desaturated, positive = vivid.",
    type: "float", default: "0", min: -1, max: 1, step: 0.01,
  },

  // ── Tone Mapping ──
  "ToneMap Amount": {
    title: "Tone Mapping Amount",
    description: "Mix factor for tone mapping.",
    type: "float", default: "1.0", min: 0, max: 1, step: 0.01, scope: "HDR → SDR conversion",
  },
  Mode: {
    title: "Tone Mapping Mode",
    description: "Tone mapping algorithm. Controls how HDR values are compressed to displayable range.",
    type: "enum", default: "Uncharted2", options: 9,
  },

  // ── Chromatic Aberration ──
  "CA Amount": {
    title: "Chromatic Aberration Amount",
    description: "Mix factor for chromatic aberration.",
    type: "float", default: "0", min: 0, max: 1, step: 0.01, scope: "Lens distortion pass",
  },
  Offset: {
    title: "CA Offset",
    description: "Color channel separation distance. Higher values produce more visible RGB fringing.",
    type: "float", default: "0.041", min: 0, max: 0.1, step: 0.001,
  },
  "Radial Modulation": {
    title: "Radial Modulation",
    description: "Increases aberration toward screen edges, mimicking real lens distortion.",
    type: "boolean", default: "false",
  },
  "Modulation Offset": {
    title: "Modulation Offset",
    description: "Center offset for radial modulation. Controls where aberration begins.",
    type: "float", default: "0.66", min: 0, max: 2, step: 0.01,
  },

  // ── Vignette ──
  "Vignette Amount": {
    title: "Vignette Amount",
    description: "Mix factor for the vignette effect.",
    type: "float", default: "1.0", min: 0, max: 1, step: 0.01,
  },
  "Vignette Offset": {
    title: "Vignette Offset",
    description: "How far from center the darkening begins. Higher values shrink the bright center.",
    type: "float", default: "0.31", min: 0, max: 1, step: 0.01,
  },
  Darkness: {
    title: "Vignette Darkness",
    description: "Maximum darkening at screen edges.",
    type: "float", default: "0.63", min: 0, max: 1, step: 0.01,
  },

  // ── Depth of Field ──
  "DoF Amount": {
    title: "Depth of Field Amount",
    description: "Mix factor for depth of field blur.",
    type: "float", default: "0", min: 0, max: 1, step: 0.01, scope: "DoF pass",
  },
  "Focus Distance": {
    title: "Focus Distance",
    description: "Normalized distance of the focal plane from the camera.",
    type: "float", default: "0.232", min: 0, max: 1, step: 0.001,
  },
  "Focal Length": {
    title: "Focal Length",
    description: "Simulated lens focal length. Affects depth-of-field falloff rate.",
    type: "float", default: "0.17", min: 0, max: 1, step: 0.01,
  },
  "Bokeh Scale": {
    title: "Bokeh Scale",
    description: "Size of the bokeh disk for out-of-focus highlights.",
    type: "float", default: "4.5", min: 0, max: 10, step: 0.1,
  },

  // ── Film Grain ──
  "Noise Amount": {
    title: "Film Grain Amount",
    description: "Mix factor for film grain noise.",
    type: "float", default: "0", min: 0, max: 1, step: 0.01,
  },
  "Noise Opacity": {
    title: "Film Grain Opacity",
    description: "Visibility of noise particles. Higher values produce a grainier image.",
    type: "float", default: "0.55", min: 0, max: 1, step: 0.01,
  },

  // ── Scanlines ──
  "Scanline Amount": {
    title: "Scanline Amount",
    description: "Mix factor for the scanline overlay.",
    type: "float", default: "0", min: 0, max: 1, step: 0.01,
  },
  Density: {
    title: "Scanline Density",
    description: "Line spacing. Higher values produce more tightly packed scanlines.",
    type: "float", default: "0.9", min: 0.1, max: 10, step: 0.1,
  },
  "Scanline Opacity": {
    title: "Scanline Opacity",
    description: "Darkness of individual scanlines.",
    type: "float", default: "0.35", min: 0, max: 1, step: 0.01,
  },

  // ── Sepia ──
  "Sepia Amount": {
    title: "Sepia Amount",
    description: "Mix factor for the sepia color tone.",
    type: "float", default: "0", min: 0, max: 1, step: 0.01,
  },
  "Sepia Intensity": {
    title: "Sepia Intensity",
    description: "Strength of the warm brown tint when active.",
    type: "float", default: "0.5", min: 0, max: 1, step: 0.01,
  },

  // ── Glitch ──
  "Glitch Amount": {
    title: "Glitch Amount",
    description: "Mix factor for the glitch effect.",
    type: "float", default: "0", min: 0, max: 1, step: 0.01,
  },
  "Glitch Mode": {
    title: "Glitch Mode",
    description: "Behavior pattern. Sporadic = random bursts, Constant variants = continuous.",
    type: "enum", default: "Constant Mild", options: 3,
  },
  "Strength Min": {
    title: "Glitch Strength Min",
    description: "Minimum distortion intensity per glitch event.",
    type: "float", default: "0.1", min: 0, max: 1, step: 0.01,
  },
  "Strength Max": {
    title: "Glitch Strength Max",
    description: "Maximum distortion intensity per glitch event.",
    type: "float", default: "0.3", min: 0, max: 1, step: 0.01,
  },
  "Duration Min": {
    title: "Glitch Duration Min",
    description: "Shortest glitch event duration in seconds.",
    type: "float", default: "0.1", min: 0, max: 2, step: 0.01,
  },
  "Duration Max": {
    title: "Glitch Duration Max",
    description: "Longest glitch event duration in seconds.",
    type: "float", default: "0.3", min: 0, max: 2, step: 0.01,
  },
  "Delay Min": {
    title: "Glitch Delay Min",
    description: "Minimum pause between glitch events.",
    type: "float", default: "1.5", min: 0, max: 10, step: 0.1,
  },
  "Delay Max": {
    title: "Glitch Delay Max",
    description: "Maximum pause between glitch events.",
    type: "float", default: "3.5", min: 0, max: 10, step: 0.1,
  },
  Ratio: {
    title: "Glitch Ratio",
    description: "Probability of a glitch event occurring at each interval.",
    type: "float", default: "0.85", min: 0, max: 1, step: 0.01,
  },

  // ── Pixelation ──
  "Pixel Amount": {
    title: "Pixelation Amount",
    description: "Mix factor for the pixelation effect.",
    type: "float", default: "0", min: 0, max: 1, step: 0.01,
  },
  Granularity: {
    title: "Pixelation Granularity",
    description: "Pixel block size. Lower values create larger, more visible blocks.",
    type: "integer", default: "100", min: 1, max: 100, step: 1,
  },

  // ── Dot Screen ──
  "DotScreen Amount": {
    title: "Dot Screen Amount",
    description: "Mix factor for the halftone dot screen overlay.",
    type: "float", default: "0", min: 0, max: 1, step: 0.01,
  },
  Angle: {
    title: "Dot Screen Angle",
    description: "Rotation of the dot pattern in radians.",
    type: "float", default: "4.23", min: 0, max: 6.28, step: 0.01,
  },
  Scale: {
    title: "Dot Screen Scale",
    description: "Size of halftone dots. Smaller values create larger dots.",
    type: "float", default: "5", min: 0.1, max: 5, step: 0.01,
  },

  // ── Color Depth ──
  "ColorDepth Amount": {
    title: "Color Depth Amount",
    description: "Mix factor for color depth reduction.",
    type: "float", default: "0", min: 0, max: 1, step: 0.01,
  },
  Bits: {
    title: "Color Bit Depth",
    description: "Color bit depth. Lower values create retro posterization.",
    type: "integer", default: "24", min: 1, max: 24, step: 1,
  },

  // ── SMAA ──
  "SMAA Amount": {
    title: "SMAA Amount",
    description: "Mix factor for SMAA anti-aliasing. Smooths jagged edges.",
    type: "float", default: "0", min: 0, max: 1, step: 0.01, scope: "Anti-aliasing pass",
  },
};

export function getPostProcessingValue(key: string): unknown {
  const field = FIELD_MAP[key];
  if (field === undefined) return undefined;
  return usePostProcessingStore.getState()[field];
}
