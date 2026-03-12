export const roadVertexShader = /* glsl */ `
uniform float uCameraZ;
uniform float uGridSize;
uniform float uRoadCurveAmplitude;
uniform float uRoadCurveFrequency;
uniform float uPointSize;
uniform float uFalloffStart;
uniform float uFalloffEnd;
uniform float uPointSizeFalloff;
uniform float uNearFade;

varying float vLocalX;
varying float vFalloff;

void main() {
  vec3 pos = position;

  // Wrap Z for infinite scrolling (same as terrain)
  float halfGrid = uGridSize * 0.5;
  pos.z = uCameraZ + mod(pos.z - uCameraZ + halfGrid, uGridSize) - halfGrid;

  // Store local X before curving (distance from road center line)
  vLocalX = pos.x;

  // Offset X by sinusoidal curve
  float roadCenterX = uRoadCurveAmplitude * sin(pos.z * uRoadCurveFrequency);
  pos.x += roadCenterX;

  // Road surface is flat at Y = 0
  pos.y = 0.0;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Distance fall-off (normalized 0..1 where 1 = at camera, 0 = at grid edge)
  float distZ = abs(pos.z - uCameraZ) / halfGrid;

  // Far fall-off: fade from falloffStart to falloffEnd
  float farFade = 1.0 - smoothstep(uFalloffStart, uFalloffEnd, distZ);
  // Near fall-off: fade in from 0 to nearFade distance
  float nearFadeVal = smoothstep(0.0, uNearFade, distZ);
  vFalloff = farFade * nearFadeVal;

  // Shrink point size with distance based on pointSizeFalloff strength
  float sizeFactor = mix(1.0, vFalloff, uPointSizeFalloff);
  gl_PointSize = uPointSize * sizeFactor * (300.0 / -mvPosition.z);

  gl_Position = projectionMatrix * mvPosition;
}
`;
