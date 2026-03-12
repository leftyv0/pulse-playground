import { NOISE_MAP } from "./noise";
import type { NoiseType } from "@/store/terrainStore";

export function buildVertexShader(noiseType: NoiseType): string {
  const noiseGlsl = NOISE_MAP[noiseType];

  return /* glsl */ `
uniform float uAmplitude;
uniform float uFrequency;
uniform vec2  uWorldOffset;
uniform float uPointSize;
uniform float uOctaves;
uniform float uLacunarity;
uniform float uGain;
uniform float uCameraZ;
uniform float uGridSize;

// Fall-off uniforms
uniform float uFalloffStart;
uniform float uFalloffEnd;
uniform float uPointSizeFalloff;
uniform float uNearFade;
uniform float uLateralFalloff;

// Road uniforms
uniform float uRoadEnabled;
uniform float uRoadWidth;
uniform float uRoadEdgeSoftness;
uniform float uRoadCurveAmplitude;
uniform float uRoadCurveFrequency;

// Footpath uniforms
uniform float uFootpathEnabled;
uniform float uFootpathWidth;
uniform float uFootpathGap;
uniform float uFootpathEdgeSoftness;

varying float vHeight;
varying float vRoadMask;
varying float vFootpathMask;
varying float vFalloff;

${noiseGlsl}

void main() {
  vec3 pos = position;

  // Wrap vertex Z around camera for infinite scrolling terrain
  float halfGrid = uGridSize * 0.5;
  pos.z = uCameraZ + mod(pos.z - uCameraZ + halfGrid, uGridSize) - halfGrid;

  // pos.xz is now in world space — sample noise directly
  vec2 noiseCoord = pos.xz * uFrequency;
  float h = getNoise(noiseCoord) * uAmplitude;

  // Road: flatten terrain along a sinusoidal curve
  float roadCenterX = uRoadCurveAmplitude * sin(pos.z * uRoadCurveFrequency);
  float halfWidth = uRoadWidth * 0.5;
  float distFromCenter = abs(pos.x - roadCenterX);
  float roadFactor = 1.0 - smoothstep(halfWidth - uRoadEdgeSoftness, halfWidth, distFromCenter);
  roadFactor *= uRoadEnabled;

  // Footpaths: flat strips flanking the curved road
  float fpInner = halfWidth + uFootpathGap;
  float fpOuter = fpInner + uFootpathWidth;
  float fpFactor = smoothstep(fpInner - uFootpathEdgeSoftness, fpInner, distFromCenter)
                 * (1.0 - smoothstep(fpOuter, fpOuter + uFootpathEdgeSoftness, distFromCenter));
  fpFactor *= uFootpathEnabled * uRoadEnabled;

  // Combined flatten factor (road takes priority)
  float flattenFactor = max(roadFactor, fpFactor);

  // Flatten height on road and footpaths
  pos.y = mix(h, 0.0, flattenFactor);

  vHeight = clamp((pos.y / max(uAmplitude, 0.01)) * 0.5 + 0.5, 0.0, 1.0);
  vRoadMask = roadFactor;
  vFootpathMask = fpFactor * (1.0 - roadFactor); // exclude road overlap

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Distance fall-off (normalized 0..1 where 1 = at camera, 0 = at grid edge)
  float distZ = abs(pos.z - uCameraZ) / halfGrid;
  float distX = abs(pos.x) / halfGrid;
  float dist = max(distZ, distX * uLateralFalloff);

  // Far fall-off: fade from falloffStart to falloffEnd
  float farFade = 1.0 - smoothstep(uFalloffStart, uFalloffEnd, dist);
  // Near fall-off: fade in from 0 to nearFade distance
  float nearFadeVal = smoothstep(0.0, uNearFade, distZ);
  vFalloff = farFade * nearFadeVal;

  // Shrink point size with distance based on pointSizeFalloff strength
  float sizeFactor = mix(1.0, vFalloff, uPointSizeFalloff);
  gl_PointSize = uPointSize * sizeFactor * (300.0 / -mvPosition.z);

  gl_Position = projectionMatrix * mvPosition;
}
`;
}
