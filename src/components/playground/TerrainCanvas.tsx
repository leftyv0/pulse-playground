"use client";

import { useRef, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useTerrainStore, type NoiseType } from "@/store/terrainStore";
import { useAudioStore } from "@/store/audioStore";
import { useDrivingStore } from "@/store/drivingStore";
import { buildVertexShader } from "@/shaders/terrainVertex";
import { terrainFragmentShader } from "@/shaders/terrainFragment";
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

/* ── Retro car with sway physics ───────────────────────────── */
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
  const velocity = useRef(0); // lateral velocity
  const swayAngle = useRef(0); // current Z-rotation (lean)
  const yawAngle = useRef(0); // current Y-rotation (steer direction)
  const pitchAngle = useRef(0); // X-rotation for accel/brake tilt

  // Wheel refs for spin animation
  const wheelRefs = [
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
  ];

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    const t = useTerrainStore.getState();
    const steerSpeed = 12;
    const maxLean = 0.18;
    const maxYaw = 0.08;
    const leanSmoothing = 8;
    const returnSmoothing = 6;
    const roadHalfWidth = 6;
    const lateralFriction = 0.92;

    // ── Forward driving physics ─────────────────────────────
    const maxForwardSpeed = t.moveSpeed; // moveSpeed is now the top speed
    const acceleration = maxForwardSpeed * 0.8; // reach top speed in ~1.25s
    const brakeForce = maxForwardSpeed * 0.4; // gentle deceleration
    const cruiseSpeed = maxForwardSpeed * 0.5; // constant base speed

    let throttle = 0;
    if (keys.current["w"] || keys.current["arrowup"]) throttle = 1;
    if (keys.current["s"] || keys.current["arrowdown"]) throttle = -1;

    if (throttle > 0) {
      // Accelerate forward
      forwardSpeed.current += acceleration * delta;
    } else if (throttle < 0) {
      // Decelerate toward cruise speed, never below it
      if (forwardSpeed.current > cruiseSpeed) {
        forwardSpeed.current -= brakeForce * delta;
        forwardSpeed.current = Math.max(cruiseSpeed, forwardSpeed.current);
      }
    } else {
      // Drift toward cruise speed when no input
      const diff = cruiseSpeed - forwardSpeed.current;
      forwardSpeed.current += diff * 2 * delta;
    }

    // Clamp — no reverse, minimum is cruise speed
    forwardSpeed.current = Math.max(cruiseSpeed, Math.min(maxForwardSpeed, forwardSpeed.current));

    // ── Lateral steering ────────────────────────────────────
    // Steering effectiveness scales with forward speed
    const speedRatio = Math.abs(forwardSpeed.current) / maxForwardSpeed;
    const effectiveSteer = steerSpeed * Math.max(0.15, speedRatio);

    let input = 0;
    if (keys.current["a"] || keys.current["arrowleft"]) input -= 1;
    if (keys.current["d"] || keys.current["arrowright"]) input += 1;

    if (input !== 0) {
      velocity.current += input * effectiveSteer * delta;
    } else {
      velocity.current *= lateralFriction;
      if (Math.abs(velocity.current) < 0.01) velocity.current = 0;
    }

    const maxVel = steerSpeed * 0.8;
    velocity.current = Math.max(-maxVel, Math.min(maxVel, velocity.current));

    carX.current += velocity.current * delta;
    carX.current = Math.max(-roadHalfWidth, Math.min(roadHalfWidth, carX.current));

    // ── Body dynamics ───────────────────────────────────────
    const targetLean = -(velocity.current / maxVel) * maxLean;
    const targetYaw = -(velocity.current / maxVel) * maxYaw;
    // Pitch: nose dips on brake, rises on accel
    const maxPitch = 0.06;
    const targetPitch = throttle < 0 ? maxPitch : throttle > 0 ? -maxPitch * 0.4 : 0;

    const smoothing = input !== 0 ? leanSmoothing : returnSmoothing;
    swayAngle.current = THREE.MathUtils.lerp(swayAngle.current, targetLean, smoothing * delta);
    yawAngle.current = THREE.MathUtils.lerp(yawAngle.current, targetYaw, smoothing * delta);
    pitchAngle.current = THREE.MathUtils.lerp(pitchAngle.current, targetPitch, 6 * delta);

    // Apply transform
    groupRef.current.position.set(carX.current, 0.4, scrollZ.current);
    groupRef.current.rotation.set(pitchAngle.current, yawAngle.current, swayAngle.current);

    // Publish driving state for other systems (particles, etc.)
    useDrivingStore.getState().setDriving(
      forwardSpeed.current,
      Math.abs(forwardSpeed.current) / maxForwardSpeed,
      velocity.current
    );

    // Spin wheels proportional to actual forward speed
    const wheelSpin = forwardSpeed.current * delta * 3;
    for (const ref of wheelRefs) {
      if (ref.current) ref.current.rotation.x -= wheelSpin;
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
      uRoadColor: { value: hexToVec3(terrainState.roadColor) },
      uFootpathEnabled: { value: terrainState.footpathEnabled ? 1.0 : 0.0 },
      uFootpathWidth: { value: terrainState.footpathWidth },
      uFootpathGap: { value: terrainState.footpathGap },
      uFootpathEdgeSoftness: { value: terrainState.footpathEdgeSoftness },
      uFootpathColor: { value: hexToVec3(terrainState.footpathColor) },
      uCameraZ: { value: 0 },
      uGridSize: { value: terrainState.farClip * 2 },
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

    // Road uniforms
    u.uRoadEnabled.value = t.roadEnabled ? 1.0 : 0.0;
    u.uRoadWidth.value = t.roadWidth;
    u.uRoadEdgeSoftness.value = t.roadEdgeSoftness;
    u.uRoadColor.value.copy(hexToVec3(t.roadColor));

    // Footpath uniforms
    u.uFootpathEnabled.value = t.footpathEnabled ? 1.0 : 0.0;
    u.uFootpathWidth.value = t.footpathWidth;
    u.uFootpathGap.value = t.footpathGap;
    u.uFootpathEdgeSoftness.value = t.footpathEdgeSoftness;
    u.uFootpathColor.value.copy(hexToVec3(t.footpathColor));

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

    // ── Camera follows car with lateral lag ──────────────────
    cameraLagX.current = THREE.MathUtils.lerp(
      cameraLagX.current,
      carX.current,
      3 * delta
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
    const tiltTarget = (accelNorm * -0.12 + speedNorm * -0.06) * t.dynTiltStrength;
    const heightTarget = (speedNorm * -0.8 + accelNorm * -0.4) * t.dynHeightStrength;
    const zTarget = (accelNorm * -1.5 + speedNorm * 1.5) * t.dynZStrength;

    // Smooth with different rates: faster response during active input, slower return
    const baseLerp = t.dynSmoothing;
    const lerpRate = Math.abs(accelNorm) > 0.05 ? baseLerp : baseLerp * 0.6;
    cameraTiltOffset.current = THREE.MathUtils.lerp(cameraTiltOffset.current, tiltTarget, lerpRate * delta);
    cameraHeightOffset.current = THREE.MathUtils.lerp(cameraHeightOffset.current, heightTarget, lerpRate * delta);
    cameraZOffset.current = THREE.MathUtils.lerp(cameraZOffset.current, zTarget, lerpRate * delta);

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
