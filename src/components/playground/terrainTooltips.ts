import type { TooltipDef } from "./ControlTooltip";
import { useTerrainStore, type TerrainPreset } from "@/store/terrainStore";

/* ── Label → store field mapping ── */

const FIELD_MAP: Record<string, keyof TerrainPreset> = {
  // Noise Params
  "Noise Type": "noiseType",
  Amplitude: "amplitude",
  Frequency: "frequency",
  Speed: "speed",
  // FBM
  Octaves: "octaves",
  Lacunarity: "lacunarity",
  Gain: "gain",
  // Visual
  "Point Size": "pointSize",
  "Grid Density": "gridDensity",
  "Falloff Start": "falloffStart",
  "Falloff End": "falloffEnd",
  "Size Falloff": "pointSizeFalloff",
  "Near Fade": "nearFade",
  "Lateral Falloff": "lateralFalloff",
  "Color Low": "colorLow",
  "Color Mid": "colorMid",
  "Color High": "colorHigh",
  Opacity: "opacity",
  // Road
  Enabled: "roadEnabled",
  Width: "roadWidth",
  "Edge Softness": "roadEdgeSoftness",
  "Terrain Falloff": "roadTerrainFalloff",
  "Road Color": "roadColor",
  "Curve Amplitude": "roadCurveAmplitude",
  "Curve Frequency": "roadCurveFrequency",
  "Road Point Size": "roadPointSize",
  "Length Segments": "roadDensity",
  "Cross Segments": "roadCrossDensity",
  "Road Falloff Start": "roadFalloffStart",
  "Road Falloff End": "roadFalloffEnd",
  "Road Size Falloff": "roadPointSizeFalloff",
  "Road Near Fade": "roadNearFade",
  // Footpaths
  "FP Enabled": "footpathEnabled",
  "FP Width": "footpathWidth",
  "FP Gap": "footpathGap",
  "FP Edge Softness": "footpathEdgeSoftness",
  "FP Color": "footpathColor",
  // Steering
  Sensitivity: "steerSensitivity",
  "Return Speed": "steerReturnSpeed",
  "Max Lateral": "steerMaxLateralOffset",
  "Surge Distance": "surgeDistance",
  "Surge Smoothing": "surgeSmoothing",
  // Drift
  "Drift Enabled": "driftEnabled",
  "Slide Amount": "driftGripLoss",
  "Slip Speed": "driftSlipRate",
  Recovery: "driftRecovery",
  "Max Angle": "driftMaxAngle",
  "Body Lean": "driftLeanMultiplier",
  "Lean Max Angle": "bodyLeanMax",
  "Yaw Max Angle": "bodyYawMax",
  "Lean Smoothing": "bodyLeanSmoothing",
  "Lean Return": "bodyLeanReturnSmoothing",
  "Lateral Range": "lateralRange",
  // Tron Trails
  "Trail Enabled": "trailEnabled",
  "Trail Color": "trailColor",
  "Trail Type": "trailType",
  "Trail Width": "trailWidth",
  "Trail Length": "trailLength",
  "Trail Opacity": "trailOpacity",
  "Trail Glow": "trailGlow",
  "Fade Exponent": "trailFadeExponent",
  "Idle Opacity": "trailIdleOpacity",
  "Height Offset": "trailHeightOffset",
  "Front Enabled": "trailFrontEnabled",
  "Front Color": "trailFrontColor",
  "Front Width": "trailFrontWidth",
  "Front Length": "trailFrontLength",
  "Front Opacity": "trailFrontOpacity",
  "Front Glow": "trailFrontGlow",
  "Front Fade Exp": "trailFrontFadeExponent",
  // Camera
  Height: "cameraHeight",
  Tilt: "cameraTilt",
  "Fly Speed": "flySpeed",
  "Move Speed": "moveSpeed",
  "Far Clip": "farClip",
  "Dyn Tilt": "dynTiltStrength",
  "Dyn Height": "dynHeightStrength",
  "Dyn Z Pull": "dynZStrength",
  "Dyn Smoothing": "dynSmoothing",
};

/* ── Tooltip definitions ── */

export const TERRAIN_TOOLTIPS: Record<string, TooltipDef> = {
  // ── Noise Params ──
  "Noise Type": {
    title: "Noise Type",
    description: "Algorithm used to generate height values. Each type produces a distinct terrain character.",
    type: "enum", default: "fbm", options: 5, scope: "Terrain vertex shader",
  },
  Amplitude: {
    title: "Amplitude",
    description: "Peak height of terrain waves. Larger values create deeper valleys and taller peaks.",
    type: "float", default: "7.2", min: 0, max: 20, step: 0.1,
  },
  Frequency: {
    title: "Frequency",
    description: "Spatial density of noise features. Higher values compress the pattern, creating smaller, tighter terrain details.",
    type: "float", default: "0.01", min: 0.01, max: 1, step: 0.01,
  },
  Speed: {
    title: "Speed",
    description: "Rate of terrain animation. Controls how fast the noise pattern scrolls beneath the car.",
    type: "float", default: "2.0", min: 0, max: 10, step: 0.1,
  },

  // ── FBM ──
  Octaves: {
    title: "Octaves",
    description: "Number of noise layers stacked together. More octaves add finer detail but cost more GPU.",
    type: "integer", default: "5", min: 1, max: 8, step: 1, affects: "GPU performance",
  },
  Lacunarity: {
    title: "Lacunarity",
    description: "Frequency multiplier between octaves. Higher values make each successive layer add much finer detail.",
    type: "float", default: "4.0", min: 1, max: 4, step: 0.1,
  },
  Gain: {
    title: "Gain",
    description: "Amplitude multiplier between octaves. Controls how much each successive layer contributes to the final height.",
    type: "float", default: "0.34", min: 0, max: 1, step: 0.01,
  },

  // ── Visual ──
  "Point Size": {
    title: "Point Size",
    description: "Base size of terrain particles in pixels. Larger values fill gaps between points.",
    type: "float", default: "0.5", min: 0.05, max: 8, step: 0.05,
  },
  "Grid Density": {
    title: "Grid Density",
    description: "Number of points per grid axis. Higher values create smoother terrain but cost more GPU.",
    type: "integer", default: "640", min: 64, max: 1024, step: 64, affects: "GPU performance",
  },
  "Falloff Start": {
    title: "Falloff Start",
    description: "Distance at which point density begins to thin out. Affects rendering performance at distance.",
    type: "float", default: "0.05", min: 0.05, max: 1.0, step: 0.01,
  },
  "Falloff End": {
    title: "Falloff End",
    description: "Distance at which points fully fade. Points beyond this are culled.",
    type: "float", default: "0.5", min: 0.1, max: 1.0, step: 0.01,
  },
  "Size Falloff": {
    title: "Size Falloff",
    description: "How much point size shrinks with distance. 0 = uniform size, 1 = full perspective scaling.",
    type: "float", default: "1.0", min: 0, max: 1, step: 0.01,
  },
  "Near Fade": {
    title: "Near Fade",
    description: "Distance at which points near the camera begin to fade. Prevents close-up visual noise.",
    type: "float", default: "0", min: 0, max: 0.3, step: 0.005,
  },
  "Lateral Falloff": {
    title: "Lateral Falloff",
    description: "Rate of point culling toward screen edges. Higher values focus detail near the center.",
    type: "float", default: "1.55", min: 0, max: 2.0, step: 0.05,
  },
  "Color Low": {
    title: "Color Low",
    description: "Color mapped to the lowest terrain elevation.",
    type: "color (hex)", default: "#00ffd0", format: "hexadecimal",
  },
  "Color Mid": {
    title: "Color Mid",
    description: "Color mapped to mid-range terrain elevation.",
    type: "color (hex)", default: "#00a2ff", format: "hexadecimal",
  },
  "Color High": {
    title: "Color High",
    description: "Color mapped to the highest terrain elevation.",
    type: "color (hex)", default: "#b70190", format: "hexadecimal",
  },
  Opacity: {
    title: "Opacity",
    description: "Global opacity of the terrain particle field.",
    type: "float", default: "1.0", min: 0, max: 1, step: 0.01,
  },

  // ── Road ──
  Enabled: {
    title: "Road Enabled",
    description: "Toggles road rendering on the terrain surface.",
    type: "boolean", default: "true", affects: "Road rendering",
  },
  Width: {
    title: "Road Width",
    description: "Width of the road in world units.",
    type: "float", default: "10", min: 1, max: 20, step: 0.5,
  },
  "Edge Softness": {
    title: "Edge Softness",
    description: "Blur at road edges. Higher values create softer transitions to terrain.",
    type: "float", default: "0", min: 0, max: 1.5, step: 0.01,
  },
  "Terrain Falloff": {
    title: "Terrain Falloff",
    description: "Distance over which terrain flattens near the road. Creates a natural roadside slope.",
    type: "float", default: "20", min: 0, max: 30, step: 0.5,
  },
  "Road Color": {
    title: "Road Color",
    description: "Base color of road particles.",
    type: "color (hex)", default: "#585858", format: "hexadecimal",
  },
  "Curve Amplitude": {
    title: "Curve Amplitude",
    description: "Maximum lateral displacement of road curves. Larger values create wider sweeping turns.",
    type: "float", default: "6.5", min: 0, max: 30, step: 0.5,
  },
  "Curve Frequency": {
    title: "Curve Frequency",
    description: "How often the road curves. Higher values create tighter, more frequent bends.",
    type: "float", default: "0.01", min: 0.01, max: 0.3, step: 0.005,
  },
  "Road Point Size": {
    title: "Road Point Size",
    description: "Size of road surface particles.",
    type: "float", default: "0.5", min: 0.5, max: 8, step: 0.1,
  },
  "Length Segments": {
    title: "Length Segments",
    description: "Point count along road length. More segments create a smoother road.",
    type: "integer", default: "512", min: 32, max: 512, step: 16, affects: "GPU performance",
  },
  "Cross Segments": {
    title: "Cross Segments",
    description: "Point count across road width. More segments create denser surface fill.",
    type: "integer", default: "24", min: 4, max: 64, step: 2,
  },
  "Road Falloff Start": {
    title: "Road Falloff Start",
    description: "Distance at which road points begin thinning.",
    type: "float", default: "0", min: 0, max: 1, step: 0.01,
  },
  "Road Falloff End": {
    title: "Road Falloff End",
    description: "Distance at which road points fully fade.",
    type: "float", default: "0.5", min: 0, max: 1, step: 0.01,
  },
  "Road Size Falloff": {
    title: "Road Size Falloff",
    description: "Perspective scaling of road point size with distance.",
    type: "float", default: "1.0", min: 0, max: 1, step: 0.01,
  },
  "Road Near Fade": {
    title: "Road Near Fade",
    description: "Fade-out distance for road points near the camera.",
    type: "float", default: "0", min: 0, max: 0.5, step: 0.01,
  },

  // ── Footpaths ──
  "FP Enabled": {
    title: "Footpath Enabled",
    description: "Toggles footpath rendering along road edges.",
    type: "boolean", default: "true", affects: "Footpath rendering",
  },
  "FP Width": {
    title: "Footpath Width",
    description: "Width of each footpath strip.",
    type: "float", default: "1.8", min: 0.2, max: 3, step: 0.1,
  },
  "FP Gap": {
    title: "Footpath Gap",
    description: "Spacing between road edge and footpath.",
    type: "float", default: "0", min: 0, max: 2, step: 0.1,
  },
  "FP Edge Softness": {
    title: "Footpath Edge Softness",
    description: "Blur at footpath edges.",
    type: "float", default: "0", min: 0, max: 1, step: 0.01,
  },
  "FP Color": {
    title: "Footpath Color",
    description: "Color of footpath particles.",
    type: "color (hex)", default: "#ffffff", format: "hexadecimal",
  },

  // ── Steering ──
  Sensitivity: {
    title: "Steer Sensitivity",
    description: "How quickly the car responds to steering input. Higher values make it more responsive.",
    type: "float", default: "6.0", min: 1, max: 12, step: 0.5,
  },
  "Return Speed": {
    title: "Return Speed",
    description: "How fast the car re-centers when steering input is released.",
    type: "float", default: "0.3", min: 0, max: 5, step: 0.1,
  },
  "Max Lateral": {
    title: "Max Lateral Offset",
    description: "Maximum side-to-side travel distance from road center.",
    type: "float", default: "4.4", min: 0.2, max: 5, step: 0.1,
  },
  "Surge Distance": {
    title: "Surge Distance",
    description: "Forward camera push on audio surge events.",
    type: "float", default: "7.0", min: 0, max: 10, step: 0.5, affects: "Audio reactivity",
  },
  "Surge Smoothing": {
    title: "Surge Smoothing",
    description: "Smoothing factor for surge animation. Higher values produce slower, smoother surges.",
    type: "float", default: "3.0", min: 1, max: 12, step: 0.5,
  },

  // ── Drift ──
  "Drift Enabled": {
    title: "Drift Enabled",
    description: "Toggles drift physics. When on, high steering input causes the car to slide.",
    type: "boolean", default: "true", affects: "Car physics",
  },
  "Slide Amount": {
    title: "Slide Amount",
    description: "How much traction is lost during a drift. Higher values mean more sideways slide.",
    type: "float", default: "0.5", min: 0.1, max: 1.0, step: 0.05,
  },
  "Slip Speed": {
    title: "Slip Speed",
    description: "Rate at which drift angle builds up during sustained input.",
    type: "float", default: "1.5", min: 0.5, max: 8.0, step: 0.25,
  },
  Recovery: {
    title: "Drift Recovery",
    description: "How quickly the car straightens after releasing steering input.",
    type: "float", default: "3.0", min: 0.5, max: 10.0, step: 0.25,
  },
  "Max Angle": {
    title: "Max Drift Angle",
    description: "Maximum visual rotation angle of the car during a drift (radians).",
    type: "float", default: "0.2", min: 0.1, max: 1.2, step: 0.05,
  },
  "Body Lean": {
    title: "Drift Body Lean",
    description: "Multiplier on body lean during drift. Amplifies the visual tilt.",
    type: "float", default: "1.0", min: 0.5, max: 5.0, step: 0.25,
  },
  "Lean Max Angle": {
    title: "Lean Max Angle",
    description: "Maximum roll angle of the car body during steering (radians).",
    type: "float", default: "0.03", min: 0.02, max: 0.5, step: 0.01,
  },
  "Yaw Max Angle": {
    title: "Yaw Max Angle",
    description: "Maximum yaw rotation added during steering (radians).",
    type: "float", default: "0.04", min: 0.01, max: 0.3, step: 0.01,
  },
  "Lean Smoothing": {
    title: "Lean Smoothing",
    description: "Smoothing applied when leaning into turns. Higher values slow lean onset.",
    type: "float", default: "8", min: 1, max: 20, step: 0.5,
  },
  "Lean Return": {
    title: "Lean Return",
    description: "Smoothing applied when returning from lean. Higher values slow recovery.",
    type: "float", default: "6", min: 1, max: 20, step: 0.5,
  },
  "Lateral Range": {
    title: "Lateral Range",
    description: "Lateral offset range that triggers drift. Car must move this far off-center to initiate.",
    type: "float", default: "0.5", min: 0.2, max: 3.0, step: 0.1,
  },

  // ── Tron Trails ──
  "Trail Enabled": {
    title: "Trail Enabled",
    description: "Toggles rear wheel light trails.",
    type: "boolean", default: "true", affects: "Trail rendering",
  },
  "Trail Color": {
    title: "Trail Color",
    description: "Color of rear wheel trails.",
    type: "color (hex)", default: "#ff6434", format: "hexadecimal",
  },
  "Trail Type": {
    title: "Trail Type",
    description: "Visual style of the trail ribbon.",
    type: "enum", default: "double", options: 4,
  },
  "Trail Width": {
    title: "Trail Width",
    description: "Width of each trail ribbon in world units.",
    type: "float", default: "0.03", min: 0.01, max: 0.5, step: 0.01,
  },
  "Trail Length": {
    title: "Trail Length",
    description: "Number of history points stored per trail. Longer values create more persistent trails.",
    type: "integer", default: "130", min: 10, max: 500, step: 10,
  },
  "Trail Opacity": {
    title: "Trail Opacity",
    description: "Base opacity of the trail at its freshest point.",
    type: "float", default: "1.0", min: 0, max: 1, step: 0.05,
  },
  "Trail Glow": {
    title: "Trail Glow",
    description: "Emissive multiplier for bloom pickup. Higher values create brighter glow.",
    type: "float", default: "2.0", min: 0, max: 10, step: 0.5, affects: "Bloom intensity",
  },
  "Fade Exponent": {
    title: "Trail Fade Exponent",
    description: "Falloff curve of trail opacity over its length. Higher values create a sharper cutoff.",
    type: "float", default: "5.0", min: 0.5, max: 5, step: 0.25,
  },
  "Idle Opacity": {
    title: "Idle Opacity",
    description: "Trail opacity when the car is stationary or moving slowly.",
    type: "float", default: "0.02", min: 0, max: 1, step: 0.05,
  },
  "Height Offset": {
    title: "Height Offset",
    description: "Vertical offset of trails from the ground plane.",
    type: "float", default: "0.01", min: -0.1, max: 0.5, step: 0.005,
  },
  "Front Enabled": {
    title: "Front Trail Enabled",
    description: "Toggles front wheel light trails.",
    type: "boolean", default: "false", affects: "Front trail rendering",
  },
  "Front Color": {
    title: "Front Trail Color",
    description: "Color of front wheel trails.",
    type: "color (hex)", default: "#ff6434", format: "hexadecimal",
  },
  "Front Width": {
    title: "Front Trail Width",
    description: "Width of front trail ribbons in world units.",
    type: "float", default: "0.05", min: 0.01, max: 0.5, step: 0.01,
  },
  "Front Length": {
    title: "Front Trail Length",
    description: "History point count for front trails.",
    type: "integer", default: "130", min: 10, max: 500, step: 10,
  },
  "Front Opacity": {
    title: "Front Trail Opacity",
    description: "Base opacity of front trails.",
    type: "float", default: "1.0", min: 0, max: 1, step: 0.05,
  },
  "Front Glow": {
    title: "Front Trail Glow",
    description: "Emissive multiplier for front trail bloom.",
    type: "float", default: "2.0", min: 0, max: 10, step: 0.5, affects: "Bloom intensity",
  },
  "Front Fade Exp": {
    title: "Front Trail Fade Exponent",
    description: "Falloff curve for front trail opacity.",
    type: "float", default: "5.0", min: 0.5, max: 5, step: 0.25,
  },

  // ── Camera ──
  Height: {
    title: "Camera Height",
    description: "Camera elevation above the ground plane.",
    type: "float", default: "2.5", min: 1, max: 30, step: 0.5,
  },
  Tilt: {
    title: "Camera Tilt",
    description: "Pitch angle of the camera. Negative values look downward.",
    type: "float", default: "-0.2", min: -1.5, max: 0, step: 0.05,
  },
  "Fly Speed": {
    title: "Fly Speed",
    description: "Vertical camera movement speed for fly mode.",
    type: "float", default: "4.5", min: 0, max: 20, step: 0.5,
  },
  "Move Speed": {
    title: "Move Speed",
    description: "Forward travel speed of the terrain scroll.",
    type: "float", default: "48", min: 1, max: 50, step: 1,
  },
  "Far Clip": {
    title: "Far Clip",
    description: "Maximum render distance. Points beyond this are culled.",
    type: "float", default: "640", min: 50, max: 1000, step: 10, affects: "GPU performance",
  },
  "Dyn Tilt": {
    title: "Dynamic Tilt",
    description: "Dynamic camera tilt reactivity to steering. Adds cinematic head-turn on corners.",
    type: "float", default: "1.7", min: 0, max: 3, step: 0.1,
  },
  "Dyn Height": {
    title: "Dynamic Height",
    description: "Dynamic camera height reactivity to steering. Lifts camera during turns.",
    type: "float", default: "0", min: 0, max: 3, step: 0.1,
  },
  "Dyn Z Pull": {
    title: "Dynamic Z Pull",
    description: "Dynamic camera zoom reactivity to steering. Pulls camera forward on turns.",
    type: "float", default: "0.9", min: 0, max: 3, step: 0.1,
  },
  "Dyn Smoothing": {
    title: "Dynamic Smoothing",
    description: "Smoothing on all dynamic camera effects. Higher values produce more gradual transitions.",
    type: "float", default: "4.0", min: 1, max: 10, step: 0.5,
  },
};

export function getTerrainValue(key: string): unknown {
  const field = FIELD_MAP[key];
  if (field === undefined) return undefined;
  return useTerrainStore.getState()[field];
}
