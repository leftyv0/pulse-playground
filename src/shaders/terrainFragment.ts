export const terrainFragmentShader = /* glsl */ `
uniform vec3 uColorLow;
uniform vec3 uColorMid;
uniform vec3 uColorHigh;
uniform float uOpacity;
uniform vec3 uRoadColor;
uniform vec3 uFootpathColor;
uniform float uEmissiveBoost;

varying float vHeight;
varying float vRoadMask;
varying float vFootpathMask;

void main() {
  // Circular point discard
  vec2 cxy = 2.0 * gl_PointCoord - 1.0;
  if (dot(cxy, cxy) > 1.0) discard;

  // 3-stop terrain gradient
  vec3 terrainColor = vHeight < 0.5
    ? mix(uColorLow, uColorMid, vHeight * 2.0)
    : mix(uColorMid, uColorHigh, (vHeight - 0.5) * 2.0);

  // Road and footpath coloring
  vec3 color = mix(terrainColor, uFootpathColor, vFootpathMask);
  color = mix(color, uRoadColor, vRoadMask);

  // HDR emissive boost — push bright areas above 1.0 so bloom can pick them up
  // Higher terrain points and brighter colors get more bloom
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  color *= 1.0 + luminance * uEmissiveBoost;

  gl_FragColor = vec4(color, uOpacity);
}
`;
