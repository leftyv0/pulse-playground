export const roadFragmentShader = /* glsl */ `
uniform vec3  uRoadColor;
uniform vec3  uFootpathColor;
uniform float uRoadWidth;
uniform float uRoadEdgeSoftness;
uniform float uFootpathGap;
uniform float uFootpathWidth;
uniform float uFootpathEdgeSoftness;
uniform float uFootpathEnabled;
uniform float uOpacity;
uniform float uEmissiveBoost;

// Shock wave color uniforms
uniform vec3  uWaveColor0;
uniform float uWaveEmissive0;
uniform vec3  uWaveColor1;
uniform float uWaveEmissive1;
uniform vec3  uWaveColor2;
uniform float uWaveEmissive2;

varying float vLocalX;
varying float vFalloff;
varying float vWaveMask0;
varying float vWaveMask1;
varying float vWaveMask2;

void main() {
  // Circular point
  vec2 cxy = 2.0 * gl_PointCoord - 1.0;
  if (dot(cxy, cxy) > 1.0) discard;

  // Discard fully faded points (distance fall-off)
  if (vFalloff < 0.01) discard;

  float halfWidth = uRoadWidth * 0.5;
  float distFromCenter = abs(vLocalX);

  // Road surface mask
  float roadMask = 1.0 - smoothstep(halfWidth - uRoadEdgeSoftness, halfWidth, distFromCenter);

  // Footpath strips
  float fpInner = halfWidth + uFootpathGap;
  float fpOuter = fpInner + uFootpathWidth;
  float fpMask = smoothstep(fpInner - uFootpathEdgeSoftness, fpInner, distFromCenter)
               * (1.0 - smoothstep(fpOuter, fpOuter + uFootpathEdgeSoftness, distFromCenter));
  fpMask *= uFootpathEnabled;

  // Discard points outside road + footpath area
  float totalMask = max(roadMask, fpMask);
  if (totalMask < 0.01) discard;

  // Color: road takes priority over footpath
  vec3 color = mix(uFootpathColor, uRoadColor, roadMask);

  // HDR emissive boost (match terrain)
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  color *= 1.0 + luminance * uEmissiveBoost;

  // Shock wave color tinting
  color = mix(color, uWaveColor0 * uWaveEmissive0, vWaveMask0);
  color = mix(color, uWaveColor1 * uWaveEmissive1, vWaveMask1);
  color = mix(color, uWaveColor2 * uWaveEmissive2, vWaveMask2);

  gl_FragColor = vec4(color, uOpacity * totalMask * vFalloff);
}
`;
