export const terrainFragmentShader = /* glsl */ `
uniform vec3 uColorLow;
uniform vec3 uColorMid;
uniform vec3 uColorHigh;
uniform float uOpacity;
uniform float uEmissiveBoost;

varying float vHeight;
varying float vRoadMask;
varying float vFootpathMask;
varying float vFalloff;

void main() {
  // Circular point discard
  vec2 cxy = 2.0 * gl_PointCoord - 1.0;
  if (dot(cxy, cxy) > 1.0) discard;

  // Discard terrain points that fall on the road or footpath
  // (the separate road mesh handles rendering there)
  float roadArea = max(vRoadMask, vFootpathMask);
  if (roadArea > 0.5) discard;

  // Discard fully faded points (distance fall-off)
  if (vFalloff < 0.01) discard;

  // 3-stop terrain gradient
  vec3 terrainColor = vHeight < 0.5
    ? mix(uColorLow, uColorMid, vHeight * 2.0)
    : mix(uColorMid, uColorHigh, (vHeight - 0.5) * 2.0);

  // HDR emissive boost — push bright areas above 1.0 so bloom can pick them up
  float luminance = dot(terrainColor, vec3(0.299, 0.587, 0.114));
  terrainColor *= 1.0 + luminance * uEmissiveBoost;

  gl_FragColor = vec4(terrainColor, uOpacity * vFalloff);
}
`;
