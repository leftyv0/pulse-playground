"use client";

import { useRef, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useTerrainStore, type NoiseType } from "@/store/terrainStore";
import { useAudioStore } from "@/store/audioStore";
import { useDrivingStore } from "@/store/drivingStore";
import { buildVertexShader } from "@/shaders/terrainVertex";
import { terrainFragmentShader } from "@/shaders/terrainFragment";
import { roadVertexShader } from "@/shaders/roadVertex";
import { roadFragmentShader } from "@/shaders/roadFragment";
import { PostProcessingEffects } from "./PostProcessingEffects";

function hexToVec3(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

const AUDIO_FEATURES = [
  "none",
  "energy",
  "rms",
  "bass",
  "mid",
  "treble",
  "volume",
  "spectralCentroid",
  "spectralFlux",
  "spectralFlatness",
  "perceptualSharpness",
  "loudnessTotal",
  "zcr",
] as const;

function getAudioValue(feature: string): number {
  if (feature === "none") return 0;
  const s = useAudioStore.getState();
  const v = (s as unknown as Record<string, unknown>)[feature];
  if (typeof v !== "number" || !isFinite(v)) return 0;
  // Normalize unbounded features (energy, spectralFlux, etc.) to 0..1 range
  // to prevent extreme terrain distortion when music plays
  return Math.min(v, 1);
}

/* ── Keyboard tracking ─────────────────────────────────────── */
function useKeyboard() {
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  return keys;
}

/* ── Retro car with drift physics ──────────────────────────── */
function RetroCar({
  scrollZ,
  carX,
  forwardSpeed,
  keys,
}: {
  scrollZ: React.MutableRefObject<number>;
  carX: React.MutableRefObject<number>;
  forwardSpeed: React.MutableRefObject<number>;
  keys: React.MutableRefObject<Record<string, boolean>>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const swayAngle = useRef(0); // current Z-rotation (lean)
  const yawAngle = useRef(0); // current Y-rotation (steer direction)
  const pitchAngle = useRef(0); // X-rotation for accel/brake tilt

  // Drift state
  const slipAngle = useRef(0); // current rear slip angle (-1..1, sign = direction)
  const driftActive = useRef(false);
  const lateralVelocity = useRef(0); // actual lateral movement speed

  // Wheel refs for spin animation
  const wheelRefs = [
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
  ];
  // Front wheel steer angle refs
  const frontWheelYaw = useRef(0);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    const t = useTerrainStore.getState();
    const maxLean = 0.18;
    const maxYaw = 0.08;
    const leanSmoothing = 8;
    const returnSmoothing = 6;

    // Steering params from store
    const steerSensitivity = t.steerSensitivity;
    const steerReturn = t.steerReturnSpeed;
    const maxLateral = t.steerMaxLateralOffset;
    const carHalfWidth = 0.8;
    const roadHalfWidth = Math.max(0, t.roadWidth * 0.5 - carHalfWidth);
    const effectiveMaxLateral = Math.min(maxLateral, roadHalfWidth);

    // Drift params
    const driftEnabled = t.driftEnabled;
    const driftGripLoss = t.driftGripLoss;
    const driftSlipRate = t.driftSlipRate;
    const driftRecoveryRate = t.driftRecovery;
    const driftMaxAngle = t.driftMaxAngle;
    const driftLeanMult = t.driftLeanMultiplier;
    const lateralRange = t.lateralRange;

    // ── Forward driving physics ─────────────────────────────
    const maxForwardSpeed = t.moveSpeed;
    const acceleration = maxForwardSpeed * 0.8;
    const brakeForce = maxForwardSpeed * 0.4;
    const cruiseSpeed = maxForwardSpeed * 0.5;

    let throttle = 0;
    if (keys.current["w"] || keys.current["arrowup"]) throttle = 1;
    if (keys.current["s"] || keys.current["arrowdown"]) throttle = -1;

    if (throttle > 0) {
      forwardSpeed.current += acceleration * delta;
    } else if (throttle < 0) {
      if (forwardSpeed.current > cruiseSpeed) {
        forwardSpeed.current -= brakeForce * delta;
        forwardSpeed.current = Math.max(cruiseSpeed, forwardSpeed.current);
      }
    } else {
      const diff = cruiseSpeed - forwardSpeed.current;
      forwardSpeed.current += diff * 2 * delta;
    }
    forwardSpeed.current = Math.max(cruiseSpeed, Math.min(maxForwardSpeed, forwardSpeed.current));

    // ── Steering input ──────────────────────────────────────
    let input = 0;
    if (keys.current["a"] || keys.current["arrowleft"]) input -= 1;
    if (keys.current["d"] || keys.current["arrowright"]) input += 1;

    // ── Combined steer + drift ────────────────────────────────
    // Steering automatically builds slip angle — no separate drift key
    const speedNorm = forwardSpeed.current / maxForwardSpeed;

    if (driftEnabled && input !== 0) {
      // Build slip in the steering direction, proportional to speed
      const targetSlip = input * driftMaxAngle * speedNorm;
      slipAngle.current = THREE.MathUtils.lerp(
        slipAngle.current,
        targetSlip,
        1 - Math.exp(-driftSlipRate * delta)
      );
    } else {
      // No input — slip recovers to zero
      slipAngle.current = THREE.MathUtils.lerp(
        slipAngle.current,
        0,
        1 - Math.exp(-driftRecoveryRate * delta)
      );
      if (Math.abs(slipAngle.current) < 0.005) slipAngle.current = 0;
    }

    const isDrifting = Math.abs(slipAngle.current) > 0.005;

    // ── Velocity-based lateral movement ─────────────────────
    const lateralAccel = steerSensitivity * 2.5 * lateralRange;
    const lateralFriction = steerReturn * 1.5;

    if (input !== 0) {
      // Steer acceleration + drift slide combined
      const steerForce = input * lateralAccel;
      const driftForce = slipAngle.current * forwardSpeed.current * driftGripLoss;
      lateralVelocity.current += (steerForce + driftForce) * delta;
    } else if (isDrifting) {
      // No input but still sliding from drift momentum
      const driftForce = slipAngle.current * forwardSpeed.current * driftGripLoss * 0.5;
      lateralVelocity.current += driftForce * delta;
    }

    // Friction — low during drift so car slides, high when coasting
    const frictionRate = isDrifting
      ? lateralFriction * 0.25
      : input !== 0
        ? lateralFriction * 0.4
        : lateralFriction;
    lateralVelocity.current = THREE.MathUtils.lerp(
      lateralVelocity.current,
      0,
      1 - Math.exp(-frictionRate * delta)
    );

    // Cap lateral velocity
    const maxLatVel = steerSensitivity * 1.5 * lateralRange;
    lateralVelocity.current = THREE.MathUtils.clamp(lateralVelocity.current, -maxLatVel, maxLatVel);

    // Integrate velocity → position
    carX.current += lateralVelocity.current * delta;

    // Spring return to center when no input and not drifting
    if (input === 0 && !isDrifting) {
      carX.current = THREE.MathUtils.lerp(carX.current, 0, 1 - Math.exp(-steerReturn * 0.5 * delta));
      if (Math.abs(carX.current) < 0.01 && Math.abs(lateralVelocity.current) < 0.01) {
        carX.current = 0;
      }
    }

    // Soft road boundary — progressive resistance
    if (effectiveMaxLateral > 0) {
      const boundaryRatio = Math.abs(carX.current) / effectiveMaxLateral;
      if (boundaryRatio > 0.7) {
        const resistAmount = Math.pow(Math.min((boundaryRatio - 0.7) / 0.3, 1), 2);
        // Push position back and dampen velocity
        lateralVelocity.current *= (1 - resistAmount * 0.8);
        carX.current = THREE.MathUtils.lerp(
          carX.current,
          Math.sign(carX.current) * effectiveMaxLateral * 0.7,
          resistAmount * (1 - Math.exp(-6 * delta))
        );
        // Smoothly reduce slip near edge
        slipAngle.current = THREE.MathUtils.lerp(slipAngle.current, 0, resistAmount * (1 - Math.exp(-3 * delta)));
      }
      // Hard safety clamp
      const hardLimit = effectiveMaxLateral * 1.1;
      if (Math.abs(carX.current) > hardLimit) {
        carX.current = Math.sign(carX.current) * hardLimit;
        lateralVelocity.current *= -0.3; // bounce back
      }
    }

    // ── Curved road following ─────────────────────────────────
    const curveAmp = t.roadCurveAmplitude;
    const curveFreq = t.roadCurveFrequency;
    const roadCenterX = curveAmp * Math.sin(scrollZ.current * curveFreq);

    // Road tangent: dx/dz = amp * freq * cos(z * freq)
    // Car travels in -Z, so forward tangent is (-dx/dz, -1) → yaw = atan2(-dx/dz, -1)
    const dxdz = curveAmp * curveFreq * Math.cos(scrollZ.current * curveFreq);
    const roadYaw = Math.atan2(-dxdz, -1);

    // Perpendicular offset: the lateral offset should be perpendicular to the road tangent
    const tangentLen = Math.sqrt(dxdz * dxdz + 1);
    const perpX = 1 / tangentLen; // perpendicular X component (normalized)
    const perpZ = -dxdz / tangentLen; // perpendicular Z component (normalized)

    // Car world position = road center + lateral offset along perpendicular
    const worldX = roadCenterX + carX.current * perpX;
    const worldZ = scrollZ.current + carX.current * perpZ;

    // ── Body dynamics ───────────────────────────────────────
    // Lean based on lateral velocity (feels responsive) + drift amplification
    const velNorm = lateralVelocity.current / Math.max(maxLatVel, 0.01);
    const driftLeanContribution = slipAngle.current * driftLeanMult;
    const targetLean = -(velNorm * maxLean + driftLeanContribution * maxLean);

    // Yaw: velocity-driven steer yaw + drift slip rotates the body
    const targetYaw = -velNorm * maxYaw - slipAngle.current;

    const maxPitch = 0.06;
    const targetPitch = throttle < 0 ? maxPitch : throttle > 0 ? -maxPitch * 0.4 : 0;

    const smoothing = (input !== 0 || isDrifting) ? leanSmoothing : returnSmoothing;
    const lerpFactor = 1 - Math.exp(-smoothing * delta);
    swayAngle.current = THREE.MathUtils.lerp(swayAngle.current, targetLean, lerpFactor);
    yawAngle.current = THREE.MathUtils.lerp(yawAngle.current, targetYaw, lerpFactor);
    pitchAngle.current = THREE.MathUtils.lerp(pitchAngle.current, targetPitch, 1 - Math.exp(-6 * delta));

    // Front wheel visual steer
    const targetWheelYaw = input * 0.35 + (isDrifting ? -slipAngle.current * 0.5 : 0);
    frontWheelYaw.current = THREE.MathUtils.lerp(frontWheelYaw.current, targetWheelYaw, 1 - Math.exp(-10 * delta));

    // Apply transform
    groupRef.current.position.set(worldX, 0.4, worldZ);
    groupRef.current.rotation.set(pitchAngle.current, roadYaw + yawAngle.current, swayAngle.current);

    // Publish driving state for other systems (particles, etc.)
    useDrivingStore.getState().setDriving(
      forwardSpeed.current,
      Math.abs(forwardSpeed.current) / maxForwardSpeed,
      carX.current
    );

    // Spin wheels proportional to actual forward speed
    const wheelSpin = forwardSpeed.current * delta * 3;
    // Rear wheels spin faster during drift (loss of traction)
    const rearWheelSpin = wheelSpin * (1 + Math.abs(slipAngle.current) * 2);
    for (let i = 0; i < wheelRefs.length; i++) {
      const ref = wheelRefs[i];
      if (!ref.current) continue;
      // i=0,1 are front wheels; i=2,3 are rear wheels
      ref.current.rotation.x -= i < 2 ? wheelSpin : rearWheelSpin;
      // Front wheels turn visually
      if (i < 2) {
        ref.current.rotation.y = frontWheelYaw.current;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 0.4, 3.2]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Cabin / roof */}
      <mesh position={[0, 0.35, -0.2]}>
        <boxGeometry args={[1.2, 0.35, 1.6]} />
        <meshStandardMaterial color="#16213e" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Wheels */}
      {[
        [-0.85, -0.15, 1.0],
        [0.85, -0.15, 1.0],
        [-0.85, -0.15, -1.0],
        [0.85, -0.15, -1.0],
      ].map((pos, i) => (
        <mesh
          key={i}
          ref={wheelRefs[i]}
          position={pos as [number, number, number]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.2, 0.2, 0.15, 12]} />
          <meshStandardMaterial color="#333" metalness={0.3} roughness={0.7} />
        </mesh>
      ))}

      {/* Taillights */}
      {[
        [-0.6, 0.1, -1.62],
        [0.6, 0.1, -1.62],
      ].map((pos, i) => (
        <mesh key={`tail-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[0.25, 0.12, 0.05]} />
          <meshStandardMaterial
            color="#ff2244"
            emissive="#ff2244"
            emissiveIntensity={2}
          />
        </mesh>
      ))}

      {/* Headlights */}
      {[
        [-0.55, 0.1, 1.62],
        [0.55, 0.1, 1.62],
      ].map((pos, i) => (
        <mesh key={`head-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[0.2, 0.1, 0.05]} />
          <meshStandardMaterial
            color="#aaeeff"
            emissive="#aaeeff"
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ── Terrain mesh that follows the camera ────────────────────── */
function TerrainPoints({
  scrollZ,
  carX,
  forwardSpeed,
}: {
  scrollZ: React.MutableRefObject<number>;
  carX: React.MutableRefObject<number>;
  forwardSpeed: React.MutableRefObject<number>;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const noiseTypeRef = useRef<NoiseType>("fbm");
  const pointsRef = useRef<THREE.Points>(null);
  const densityRef = useRef(256);
  const farClipRef = useRef(200);

  const { camera } = useThree();

  // Build initial shader + uniforms
  const terrainState = useTerrainStore.getState();
  const uniformsRef = useRef(
    (() => ({
      uAmplitude: { value: terrainState.amplitude },
      uFrequency: { value: terrainState.frequency },
      uWorldOffset: { value: new THREE.Vector2(0, 0) },
      uPointSize: { value: terrainState.pointSize },
      uOctaves: { value: terrainState.octaves },
      uLacunarity: { value: terrainState.lacunarity },
      uGain: { value: terrainState.gain },
      uColorLow: { value: hexToVec3(terrainState.colorLow) },
      uColorMid: { value: hexToVec3(terrainState.colorMid) },
      uColorHigh: { value: hexToVec3(terrainState.colorHigh) },
      uOpacity: { value: terrainState.opacity },
      uRoadEnabled: { value: terrainState.roadEnabled ? 1.0 : 0.0 },
      uRoadWidth: { value: terrainState.roadWidth },
      uRoadEdgeSoftness: { value: terrainState.roadEdgeSoftness },
      uRoadCurveAmplitude: { value: terrainState.roadCurveAmplitude },
      uRoadCurveFrequency: { value: terrainState.roadCurveFrequency },
      uFootpathEnabled: { value: terrainState.footpathEnabled ? 1.0 : 0.0 },
      uFootpathWidth: { value: terrainState.footpathWidth },
      uFootpathGap: { value: terrainState.footpathGap },
      uFootpathEdgeSoftness: { value: terrainState.footpathEdgeSoftness },
      uCameraZ: { value: 0 },
      uGridSize: { value: terrainState.farClip * 2 },
      uFalloffStart: { value: terrainState.falloffStart },
      uFalloffEnd: { value: terrainState.falloffEnd },
      uPointSizeFalloff: { value: terrainState.pointSizeFalloff },
      uNearFade: { value: terrainState.nearFade },
      uLateralFalloff: { value: terrainState.lateralFalloff },
      uEmissiveBoost: { value: 1.5 },
    }))()
  );

  const vertexShaderRef = useRef(buildVertexShader(terrainState.noiseType));

  // Build geometry sized to fill the far clip range
  const buildGeometry = useCallback((density: number, far: number) => {
    const size = far * 2;
    const geo = new THREE.PlaneGeometry(size, size, density, density);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const geometry = useMemo(
    () => buildGeometry(terrainState.gridDensity, terrainState.farClip),
    []
  );

  // Camera lag for lateral following
  const cameraLagX = useRef(0);

  // Dynamic camera refs (acceleration-driven)
  const prevSpeed = useRef(0);
  const cameraTiltOffset = useRef(0);
  const cameraHeightOffset = useRef(0);
  const cameraZOffset = useRef(0);

  useFrame((_state, delta) => {
    const t = useTerrainStore.getState();
    const u = uniformsRef.current;

    // ── Forward scroll driven by car velocity ─────────────────
    scrollZ.current -= forwardSpeed.current * delta;

    // ── Infinite scrolling: mesh stays at origin, shader wraps vertices ──
    u.uCameraZ.value = scrollZ.current;
    u.uGridSize.value = t.farClip * 2;

    // ── Audio mapping ───────────────────────────────────────
    const ampAudio =
      getAudioValue(t.audioAmplitude.feature) * t.audioAmplitude.sensitivity;
    const freqAudio =
      getAudioValue(t.audioFrequency.feature) * t.audioFrequency.sensitivity;

    // Update uniforms
    u.uAmplitude.value = t.amplitude + ampAudio;
    u.uFrequency.value = t.frequency + freqAudio * 0.1;
    u.uPointSize.value = t.pointSize;
    u.uOctaves.value = t.octaves;
    u.uLacunarity.value = t.lacunarity;
    u.uGain.value = t.gain;
    u.uOpacity.value = t.opacity;

    // Fall-off uniforms
    u.uFalloffStart.value = t.falloffStart;
    u.uFalloffEnd.value = t.falloffEnd;
    u.uPointSizeFalloff.value = t.pointSizeFalloff;
    u.uNearFade.value = t.nearFade;
    u.uLateralFalloff.value = t.lateralFalloff;

    // Road uniforms (terrain still needs these for flattening + discard)
    u.uRoadEnabled.value = t.roadEnabled ? 1.0 : 0.0;
    u.uRoadWidth.value = t.roadWidth;
    u.uRoadEdgeSoftness.value = t.roadEdgeSoftness;
    u.uRoadCurveAmplitude.value = t.roadCurveAmplitude;
    u.uRoadCurveFrequency.value = t.roadCurveFrequency;

    // Footpath uniforms (terrain needs these for flattening + discard)
    u.uFootpathEnabled.value = t.footpathEnabled ? 1.0 : 0.0;
    u.uFootpathWidth.value = t.footpathWidth;
    u.uFootpathGap.value = t.footpathGap;
    u.uFootpathEdgeSoftness.value = t.footpathEdgeSoftness;

    // Color — shift toward high when audio color mapping active
    const colorAudio =
      getAudioValue(t.audioColor.feature) * t.audioColor.sensitivity;
    if (colorAudio > 0.01) {
      const base = hexToVec3(t.colorMid);
      const high = hexToVec3(t.colorHigh);
      const blend = Math.min(colorAudio, 1);
      u.uColorMid.value.lerpVectors(base, high, blend);
    } else {
      u.uColorMid.value.copy(hexToVec3(t.colorMid));
    }
    u.uColorLow.value.copy(hexToVec3(t.colorLow));
    u.uColorHigh.value.copy(hexToVec3(t.colorHigh));

    // ── Rebuild vertex shader if noise type changed ─────────
    if (t.noiseType !== noiseTypeRef.current) {
      noiseTypeRef.current = t.noiseType;
      const newVert = buildVertexShader(t.noiseType);
      vertexShaderRef.current = newVert;
      if (materialRef.current) {
        materialRef.current.vertexShader = newVert;
        materialRef.current.needsUpdate = true;
      }
    }

    // ── Rebuild geometry if density or farClip changed ──────
    if (
      t.gridDensity !== densityRef.current ||
      t.farClip !== farClipRef.current
    ) {
      densityRef.current = t.gridDensity;
      farClipRef.current = t.farClip;
      const newGeo = buildGeometry(t.gridDensity, t.farClip);
      if (pointsRef.current) {
        pointsRef.current.geometry.dispose();
        pointsRef.current.geometry = newGeo;
      }
    }

    // ── Camera follows car along curved road ──────────────────
    const camCurveAmp = t.roadCurveAmplitude;
    const camCurveFreq = t.roadCurveFrequency;
    const camRoadCenterX = camCurveAmp * Math.sin(scrollZ.current * camCurveFreq);
    // Perpendicular offset (same math as car)
    const camDxdz = camCurveAmp * camCurveFreq * Math.cos(scrollZ.current * camCurveFreq);
    const camTangentLen = Math.sqrt(camDxdz * camDxdz + 1);
    const camPerpX = 1 / camTangentLen;
    const camWorldX = camRoadCenterX + carX.current * camPerpX;
    cameraLagX.current = THREE.MathUtils.lerp(
      cameraLagX.current,
      camWorldX,
      1 - Math.exp(-3 * delta)
    );

    // ── Dynamic camera based on acceleration ──────────────────
    const maxSpeed = t.moveSpeed;
    const accel = (forwardSpeed.current - prevSpeed.current) / Math.max(delta, 0.001);
    prevSpeed.current = forwardSpeed.current;

    // Normalize acceleration to roughly -1..1 range
    const accelNorm = THREE.MathUtils.clamp(accel / (maxSpeed * 2), -1, 1);
    // Normalize current speed to 0..1
    const speedNorm = Math.abs(forwardSpeed.current) / maxSpeed;

    // Accel tilts camera forward (negative = looking more downward), decel tilts back
    // High speed also pulls camera lower and further back for drama
    const tiltTarget = (accelNorm * 0.12 + speedNorm * 0.06) * t.dynTiltStrength;
    const heightTarget = (speedNorm * 0.8 + accelNorm * 0.4) * t.dynHeightStrength;
    const zTarget = (accelNorm * 1.5 + speedNorm * -1.5) * t.dynZStrength;

    // Smooth with different rates: faster response during active input, slower return
    const baseLerp = t.dynSmoothing;
    const lerpRate = Math.abs(accelNorm) > 0.05 ? baseLerp : baseLerp * 0.6;
    const camLerp = 1 - Math.exp(-lerpRate * delta);
    cameraTiltOffset.current = THREE.MathUtils.lerp(cameraTiltOffset.current, tiltTarget, camLerp);
    cameraHeightOffset.current = THREE.MathUtils.lerp(cameraHeightOffset.current, heightTarget, camLerp);
    cameraZOffset.current = THREE.MathUtils.lerp(cameraZOffset.current, zTarget, camLerp);

    camera.position.set(
      cameraLagX.current * 0.7,
      t.cameraHeight + cameraHeightOffset.current,
      scrollZ.current + 10 + cameraZOffset.current
    );
    camera.rotation.set(t.cameraTilt + cameraTiltOffset.current, 0, 0);

    // Dynamic far clip
    if ((camera as THREE.PerspectiveCamera).far !== t.farClip) {
      (camera as THREE.PerspectiveCamera).far = t.farClip;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShaderRef.current}
        fragmentShader={terrainFragmentShader}
        uniforms={uniformsRef.current}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

/* ── Road mesh (independent density/point size) ────────────────── */
function RoadPoints({
  scrollZ,
}: {
  scrollZ: React.MutableRefObject<number>;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const densityRef = useRef(200);
  const farClipRef = useRef(200);
  const widthRef = useRef(4.0);
  const fpWidthRef = useRef(0.8);
  const fpGapRef = useRef(0.2);

  const terrainState = useTerrainStore.getState();

  const uniformsRef = useRef(
    (() => ({
      uCameraZ: { value: 0 },
      uGridSize: { value: terrainState.farClip * 2 },
      uRoadCurveAmplitude: { value: terrainState.roadCurveAmplitude },
      uRoadCurveFrequency: { value: terrainState.roadCurveFrequency },
      uPointSize: { value: terrainState.roadPointSize },
      uRoadColor: { value: hexToVec3(terrainState.roadColor) },
      uRoadWidth: { value: terrainState.roadWidth },
      uRoadEdgeSoftness: { value: terrainState.roadEdgeSoftness },
      uFootpathColor: { value: hexToVec3(terrainState.footpathColor) },
      uFootpathGap: { value: terrainState.footpathGap },
      uFootpathWidth: { value: terrainState.footpathWidth },
      uFootpathEdgeSoftness: { value: terrainState.footpathEdgeSoftness },
      uFootpathEnabled: { value: terrainState.footpathEnabled ? 1.0 : 0.0 },
      uOpacity: { value: terrainState.opacity },
      uEmissiveBoost: { value: 1.5 },
    }))()
  );

  // Build road strip geometry: narrow plane covering road + footpaths
  const buildRoadGeometry = useCallback(
    (density: number, far: number, roadW: number, fpGap: number, fpW: number) => {
      const stripHalfWidth = roadW * 0.5 + fpGap + fpW + 0.5; // +0.5 for edge softness
      const stripWidth = stripHalfWidth * 2;
      const stripLength = far * 2;
      // Scale segments proportionally: more along length, fewer across width
      const segZ = density;
      const segX = Math.max(8, Math.ceil(density * stripWidth / stripLength));
      const geo = new THREE.PlaneGeometry(stripWidth, stripLength, segX, segZ);
      geo.rotateX(-Math.PI / 2);
      return geo;
    },
    []
  );

  const geometry = useMemo(
    () =>
      buildRoadGeometry(
        terrainState.roadDensity,
        terrainState.farClip,
        terrainState.roadWidth,
        terrainState.footpathGap,
        terrainState.footpathWidth
      ),
    []
  );

  useFrame(() => {
    const t = useTerrainStore.getState();
    const u = uniformsRef.current;

    u.uCameraZ.value = scrollZ.current;
    u.uGridSize.value = t.farClip * 2;
    u.uRoadCurveAmplitude.value = t.roadCurveAmplitude;
    u.uRoadCurveFrequency.value = t.roadCurveFrequency;
    u.uPointSize.value = t.roadPointSize;
    u.uRoadColor.value.copy(hexToVec3(t.roadColor));
    u.uRoadWidth.value = t.roadWidth;
    u.uRoadEdgeSoftness.value = t.roadEdgeSoftness;
    u.uFootpathColor.value.copy(hexToVec3(t.footpathColor));
    u.uFootpathGap.value = t.footpathGap;
    u.uFootpathWidth.value = t.footpathWidth;
    u.uFootpathEdgeSoftness.value = t.footpathEdgeSoftness;
    u.uFootpathEnabled.value = t.footpathEnabled ? 1.0 : 0.0;
    u.uOpacity.value = t.opacity;

    // Rebuild geometry if road shape or density changed
    if (
      t.roadDensity !== densityRef.current ||
      t.farClip !== farClipRef.current ||
      t.roadWidth !== widthRef.current ||
      t.footpathWidth !== fpWidthRef.current ||
      t.footpathGap !== fpGapRef.current
    ) {
      densityRef.current = t.roadDensity;
      farClipRef.current = t.farClip;
      widthRef.current = t.roadWidth;
      fpWidthRef.current = t.footpathWidth;
      fpGapRef.current = t.footpathGap;
      const newGeo = buildRoadGeometry(
        t.roadDensity,
        t.farClip,
        t.roadWidth,
        t.footpathGap,
        t.footpathWidth
      );
      if (pointsRef.current) {
        pointsRef.current.geometry.dispose();
        pointsRef.current.geometry = newGeo;
      }
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={roadVertexShader}
        fragmentShader={roadFragmentShader}
        uniforms={uniformsRef.current}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

/* ── Scene orchestrator ──────────────────────────────────────── */
function Scene() {
  const scrollZ = useRef(0);
  const carX = useRef(0);
  const initialCruise = useTerrainStore.getState().moveSpeed * 0.5;
  const forwardSpeed = useRef(initialCruise);
  const keys = useKeyboard();

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, -2]} intensity={1} color="#ff66ff" />
      <TerrainPoints scrollZ={scrollZ} carX={carX} forwardSpeed={forwardSpeed} />
      <RoadPoints scrollZ={scrollZ} />
      <RetroCar scrollZ={scrollZ} carX={carX} forwardSpeed={forwardSpeed} keys={keys} />
      <PostProcessingEffects />
    </>
  );
}

export function TerrainCanvas() {
  const farClip = useTerrainStore((s) => s.farClip);

  return (
    <div className="absolute inset-0">
      <Canvas
        gl={{ antialias: true, alpha: false, toneMapping: THREE.NoToneMapping }}
        camera={{ fov: 60, near: 0.1, far: farClip, position: [0, 6, 10] }}
        dpr={[1, 2]}
        style={{ background: "#0a0a0f" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
