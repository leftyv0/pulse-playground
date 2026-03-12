export const roadVertexShader = /* glsl */ `
uniform float uCameraZ;
uniform float uGridSize;
uniform float uRoadCurveAmplitude;
uniform float uRoadCurveFrequency;
uniform float uPointSize;

varying float vLocalX;

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
  gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;
