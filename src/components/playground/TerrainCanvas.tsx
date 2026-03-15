"use client";

import React, { useRef, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useTerrainStore, type NoiseType, type TrailType } from "@/store/terrainStore";
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


/* ── Keyboard tracking ─────────────────────────────────────── */
function useKeyboard() {
  const keysRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  return keysRef;
}

/* ── Retro car with drift physics ──────────────────────────── */
export interface TireWorldPositions {
  rearLeft: THREE.Vector3;
  rearRight: THREE.Vector3;
  frontLeft: THREE.Vector3;
  frontRight: THREE.Vector3;
}

function RetroCar({
  scrollZRef,
  carXRef,
  forwardSpeedRef,
  keysRef,
  tirePositionsRef,
}: {
  scrollZRef: React.MutableRefObject<number>;
  carXRef: React.MutableRefObject<number>;
  forwardSpeedRef: React.MutableRefObject<number>;
  keysRef: React.MutableRefObject<Record<string, boolean>>;
  tirePositionsRef: React.MutableRefObject<TireWorldPositions>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const swayAngle = useRef(0); // current Z-rotation (lean)
  const yawAngle = useRef(0); // current Y-rotation (steer direction)
  const pitchAngle = useRef(0); // X-rotation for accel/brake tilt
  const surgeOffset = useRef(0); // forward/back displacement from accel/decel

  // Drift state
  const slipAngle = useRef(0); // current rear slip angle (-1..1, sign = direction)
  const lateralVelocity = useRef(0); // actual lateral movement speed

  // Load GLB model
  const { scene: carScene } = useGLTF("/models/car_model_01/scene.gltf");

  // Scaled model dimensions (set during useMemo)
  const modelDimsRef = useRef({ halfWidth: 0.85, halfLength: 1.6, bottom: -0.3 });
  const carScaleRef = useRef(0.006);

  // Friendly name → material name mapping for Ford GT 2005
  // stripTexture: remove baseColorTexture so color picker controls appearance directly
  const CAR_MATERIAL_MAP: { label: string; pattern: string; stripTexture?: boolean }[] = [
    { label: "Body Paint", pattern: "Paint", stripTexture: true },
    { label: "Chassis", pattern: "Chassis" },
    { label: "Glass", pattern: "Glass" },
    { label: "Grille", pattern: "Grille_A" },
    { label: "Headlight Housing", pattern: "Light" },
    { label: "Headlight Refractor", pattern: "Refracted" },
    { label: "Rear Refractor", pattern: "Refracted_2" },
    { label: "Taillight Glass", pattern: "Red_Glasss" },
    { label: "Indicator Glass", pattern: "Orange_Glass" },
    { label: "Interior", pattern: "Interior" },
    { label: "Screen", pattern: "Screen" },
    { label: "Matte Black", pattern: "Black" },
    { label: "Glossy Black", pattern: "Glossy_Black" },
    { label: "Chrome", pattern: "Chrome" },
    { label: "Badges", pattern: "Badges" },
    { label: "Wheel Rims", pattern: "mm_wheel" },
    { label: "Tyres", pattern: "mm_tyre" },
    { label: "Brake Rotors", pattern: "mm_rotor" },
  ];

  // Map of label → material ref (populated once during useMemo)
  const materialMapRef = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());

  const carModel = useMemo(() => {
    const clone = carScene.clone(true);

    // Compute bounding box and center the model at its geometric center
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center model at origin
    clone.position.set(-center.x, -center.y, -center.z);

    // Auto-scale: target car length ~3.2 scene units along longest horizontal axis
    const targetLength = 3.2;
    const maxDim = Math.max(size.x, size.z);
    const scale = targetLength / maxDim;
    carScaleRef.current = scale;

    // Model dimensions map directly (X→X, Z→Z)
    modelDimsRef.current = {
      halfWidth: (size.x * scale) / 2,
      halfLength: (size.z * scale) / 2,
      bottom: (-size.y / 2) * scale,
    };

    // Collect all unique materials from the model
    const allMats: THREE.MeshStandardMaterial[] = [];
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) {
          if (mat.name && !allMats.some((m) => m.name === mat.name)) {
            allMats.push(mat as THREE.MeshStandardMaterial);
          }
        }
      }
    });

    // Match materials to friendly labels
    const map = new Map<string, THREE.MeshStandardMaterial>();
    for (const { label, pattern, stripTexture } of CAR_MATERIAL_MAP) {
      // Prefer exact match, then fall back to includes
      const mat = allMats.find((m) => m.name === pattern)
        ?? allMats.find((m) => m.name.includes(pattern));
      if (mat) {
        if (stripTexture && mat.map) {
          mat.map = null;
          mat.needsUpdate = true;
        }
        map.set(label, mat);
      }
    }
    materialMapRef.current = map;

    return clone;
  }, [carScene]);

  // Apply car material colors and emissive settings from store
  const carMaterialColors = useTerrainStore((s) => s.carMaterialColors);
  const carEmissiveSettings = useTerrainStore((s) => s.carEmissiveSettings);
  useEffect(() => {
    const map = materialMapRef.current;
    for (const [label, mat] of map) {
      const hex = carMaterialColors[label];
      if (hex) {
        mat.color.set(hex);
      }
      const emissive = carEmissiveSettings[label];
      if (emissive) {
        if (mat.emissive) mat.emissive.set(emissive.color);
        mat.emissiveIntensity = emissive.intensity;
      }
    }
  }, [carMaterialColors, carEmissiveSettings]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    const t = useTerrainStore.getState();
    const maxLean = t.bodyLeanMax;
    const maxYaw = t.bodyYawMax;
    const leanSmoothing = t.bodyLeanSmoothing;
    const returnSmoothing = t.bodyLeanReturnSmoothing;

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
    if (keysRef.current["w"] || keysRef.current["arrowup"]) throttle = 1;
    if (keysRef.current["s"] || keysRef.current["arrowdown"]) throttle = -1;

    if (throttle > 0) {
      forwardSpeedRef.current += acceleration * delta;
    } else if (throttle < 0) {
      if (forwardSpeedRef.current > cruiseSpeed) {
        forwardSpeedRef.current -= brakeForce * delta;
        forwardSpeedRef.current = Math.max(cruiseSpeed, forwardSpeedRef.current);
      }
    } else {
      const diff = cruiseSpeed - forwardSpeedRef.current;
      forwardSpeedRef.current += diff * 2 * delta;
    }
    forwardSpeedRef.current = Math.max(cruiseSpeed, Math.min(maxForwardSpeed, forwardSpeedRef.current));

    // ── Steering input ──────────────────────────────────────
    let input = 0;
    if (keysRef.current["a"] || keysRef.current["arrowleft"]) input -= 1;
    if (keysRef.current["d"] || keysRef.current["arrowright"]) input += 1;

    // ── Combined steer + drift ────────────────────────────────
    // Steering automatically builds slip angle — no separate drift key
    const speedNorm = forwardSpeedRef.current / maxForwardSpeed;

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
      const driftForce = slipAngle.current * forwardSpeedRef.current * driftGripLoss;
      lateralVelocity.current += (steerForce + driftForce) * delta;
    } else if (isDrifting) {
      // No input but still sliding from drift momentum
      const driftForce = slipAngle.current * forwardSpeedRef.current * driftGripLoss * 0.5;
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
    carXRef.current += lateralVelocity.current * delta;

    // Smooth return to center when no input and not drifting
    if (input === 0 && !isDrifting && Math.abs(carXRef.current) > 0.01) {
      // Drive return through velocity so there's no pause — car immediately
      // starts moving back at a speed proportional to the Return Speed control.
      const returnForce = -Math.sign(carXRef.current) * steerReturn * 3.0;
      lateralVelocity.current = THREE.MathUtils.lerp(
        lateralVelocity.current,
        returnForce,
        1 - Math.exp(-steerReturn * 4.0 * delta)
      );
    } else if (input === 0 && !isDrifting) {
      // Snap to center when close enough
      carXRef.current = 0;
      lateralVelocity.current = 0;
    }

    // Road boundary — progressive deceleration, no hard bounce
    if (effectiveMaxLateral > 0) {
      const absX = Math.abs(carXRef.current);
      const sign = Math.sign(carXRef.current);
      const movingOutward = Math.sign(lateralVelocity.current) === sign;

      // Start braking zone at 60% of max lateral
      const brakeStart = effectiveMaxLateral * 0.6;

      if (absX > brakeStart) {
        // 0 at brakeStart → 1 at effectiveMaxLateral
        const t = Math.min((absX - brakeStart) / (effectiveMaxLateral - brakeStart), 1);
        // Cubic ramp: gentle at first, aggressive near edge
        const strength = t * t * t;

        if (movingOutward) {
          // Progressive velocity damping — stronger near edge
          const damping = 1 - strength * 0.92;
          lateralVelocity.current *= damping;

          // Push-back force that increases near edge (prevents overshoot)
          const pushBack = strength * steerSensitivity * 3.0 * lateralRange;
          lateralVelocity.current -= sign * pushBack * delta;

          // Don't touch slipAngle — preserve drift pose at the edge
        }
      }

      // Soft clamp — only if somehow past the edge, gently pull back
      if (absX > effectiveMaxLateral) {
        const overshoot = absX - effectiveMaxLateral;
        // Spring force pulling back proportional to overshoot
        lateralVelocity.current -= sign * overshoot * 15 * delta;
        // Gently ease position back (don't snap)
        carXRef.current = THREE.MathUtils.lerp(carXRef.current, sign * effectiveMaxLateral, 1 - Math.exp(-10 * delta));
      }
    }

    // ── Curved road following ─────────────────────────────────
    const curveAmp = t.roadCurveAmplitude;
    const curveFreq = t.roadCurveFrequency;
    const roadCenterX = curveAmp * Math.sin(scrollZRef.current * curveFreq);

    // Road tangent: dx/dz = amp * freq * cos(z * freq)
    // Car travels in -Z, so forward tangent is (-dx/dz, -1) → yaw = atan2(-dx/dz, -1)
    const dxdz = curveAmp * curveFreq * Math.cos(scrollZRef.current * curveFreq);
    const roadYaw = Math.atan2(-dxdz, -1);

    // Perpendicular offset: the lateral offset should be perpendicular to the road tangent
    const tangentLen = Math.sqrt(dxdz * dxdz + 1);
    const perpX = 1 / tangentLen; // perpendicular X component (normalized)
    const perpZ = -dxdz / tangentLen; // perpendicular Z component (normalized)

    // ── Forward surge (car moves forward/back with accel/decel) ──
    const maxSurge = t.surgeDistance;
    const surgeSmoothing = t.surgeSmoothing;
    // Normalize speed above cruise: 0 at cruise, 1 at max
    const speedAboveCruise = (forwardSpeedRef.current - cruiseSpeed) / (maxForwardSpeed - cruiseSpeed);
    const targetSurge = THREE.MathUtils.clamp(speedAboveCruise, 0, 1) * -maxSurge;
    surgeOffset.current = THREE.MathUtils.lerp(
      surgeOffset.current,
      targetSurge,
      1 - Math.exp(-surgeSmoothing * delta)
    );

    // Car world position = road center + lateral offset along perpendicular
    const worldX = roadCenterX + carXRef.current * perpX;
    const worldZ = scrollZRef.current + carXRef.current * perpZ + surgeOffset.current;

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

    // Apply transform – lift car to compensate for body roll so it doesn't clip below the road
    const rollLift = modelDimsRef.current.halfWidth * Math.abs(Math.sin(swayAngle.current));
    groupRef.current.position.set(worldX, 0.4 + rollLift, worldZ);
    groupRef.current.rotation.set(pitchAngle.current, roadYaw + yawAngle.current, swayAngle.current);

    // Publish tire world positions for trail system
    groupRef.current.updateMatrixWorld(true);
    // Derive tire positions from actual model dimensions
    const dims = modelDimsRef.current;
    const trackX = dims.halfWidth * 0.78; // inset from body edge
    const tireY = dims.bottom + 0.05;     // near ground
    const frontZ = dims.halfLength * 0.55;
    const rearZ = -dims.halfLength * 0.50;
    const tireLocalPositions = [
      new THREE.Vector3(-trackX, tireY, rearZ),   // rear-left
      new THREE.Vector3(trackX, tireY, rearZ),    // rear-right
      new THREE.Vector3(-trackX, tireY, frontZ),  // front-left
      new THREE.Vector3(trackX, tireY, frontZ),   // front-right
    ];
    const tp = tirePositionsRef.current;
    tp.rearLeft.copy(tireLocalPositions[0]).applyMatrix4(groupRef.current.matrixWorld);
    tp.rearRight.copy(tireLocalPositions[1]).applyMatrix4(groupRef.current.matrixWorld);
    tp.frontLeft.copy(tireLocalPositions[2]).applyMatrix4(groupRef.current.matrixWorld);
    tp.frontRight.copy(tireLocalPositions[3]).applyMatrix4(groupRef.current.matrixWorld);

    // Publish driving state for other systems (particles, etc.)
    useDrivingStore.getState().setDriving(
      forwardSpeedRef.current,
      Math.abs(forwardSpeedRef.current) / maxForwardSpeed,
      carXRef.current
    );

  });

  return (
    <group ref={groupRef}>
      <primitive
        object={carModel}
        scale={carScaleRef.current}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
}

/* ── Tron-style tire trails ─────────────────────────────────── */

const TRAIL_MAX_POINTS = 512;

const trailVertexShader = /* glsl */ `
  attribute float aAlpha;
  attribute float aTrailIndex;
  varying float vAlpha;
  varying float vTrailIndex;

  void main() {
    vAlpha = aAlpha;
    vTrailIndex = aTrailIndex;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const trailFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uGlow;
  uniform int uTrailType; // 0=solid, 1=dashed, 2=pulse, 3=double
  uniform float uTime;
  varying float vAlpha;
  varying float vTrailIndex;

  void main() {
    float alpha = vAlpha;

    // Trail type effects
    if (uTrailType == 1) {
      // Dashed: modulate by trail index
      float dash = step(0.5, fract(vTrailIndex * 0.15));
      alpha *= dash;
    } else if (uTrailType == 2) {
      // Pulse: sinusoidal brightness wave
      float wave = 0.5 + 0.5 * sin(vTrailIndex * 0.3 - uTime * 4.0);
      alpha *= 0.4 + 0.6 * wave;
    }
    // double type is handled by geometry (two narrower ribbons offset)

    if (alpha < 0.001) discard;

    // Emissive glow — boost color beyond 1.0 for bloom
    vec3 col = uColor * (1.0 + uGlow);
    gl_FragColor = vec4(col, alpha * uOpacity);
  }
`;

function TronTrailRibbon({
  tirePositionsRef,
  tireKey,
  offset,
  isFront,
}: {
  tirePositionsRef: React.MutableRefObject<TireWorldPositions>;
  tireKey: "rearLeft" | "rearRight" | "frontLeft" | "frontRight";
  offset?: THREE.Vector3; // for "double" type lateral offset
  isFront?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  // Trail stored as a sequential array: index 0 = newest, index N = oldest
  // Each entry stores the center position + perpendicular direction
  const trailPointsRef = useRef<{ x: number; y: number; z: number; px: number; pz: number }[]>([]);
  const lastPosRef = useRef(new THREE.Vector3());
  const initializedRef = useRef(false);
  const smoothedOpacityRef = useRef(1);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(TRAIL_MAX_POINTS * 2 * 3);
    const alphas = new Float32Array(TRAIL_MAX_POINTS * 2);
    const trailIndices = new Float32Array(TRAIL_MAX_POINTS * 2);
    const indices: number[] = [];

    for (let i = 0; i < TRAIL_MAX_POINTS - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, c, b, b, c, d);
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute("aTrailIndex", new THREE.BufferAttribute(trailIndices, 1));
    geo.setIndex(indices);
    return geo;
  }, []);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Vector3(0.13, 0.83, 0.93) },
      uOpacity: { value: 0.9 },
      uGlow: { value: 3.0 },
      uTrailType: { value: 0 },
      uTime: { value: 0 },
    }),
    []
  );

  useFrame((_state, delta) => {
    const st = useTerrainStore.getState();
    // Check enabled: global trail + front-specific override
    const enabled = isFront ? (st.trailEnabled && st.trailFrontEnabled) : st.trailEnabled;
    if (!enabled) {
      if (trailPointsRef.current.length > 0) {
        trailPointsRef.current = [];
        const alphas = geometry.attributes.aAlpha.array as Float32Array;
        alphas.fill(0);
        geometry.attributes.aAlpha.needsUpdate = true;
        initializedRef.current = false;
      }
      return;
    }

    // Resolve front-specific overrides
    const trailColor = isFront ? st.trailFrontColor : st.trailColor;
    const trailOpacity = isFront ? st.trailFrontOpacity : st.trailOpacity;
    const trailGlow = isFront ? st.trailFrontGlow : st.trailGlow;
    const trailWidth = isFront ? st.trailFrontWidth : st.trailWidth;
    const trailFadeExp = isFront ? st.trailFrontFadeExponent : st.trailFadeExponent;
    const trailLength = isFront ? st.trailFrontLength : st.trailLength;

    // Lerp opacity based on acceleration state
    // Cruise = 0.5 normalized; above that means actively accelerating
    const spd = useDrivingStore.getState().speedNormalized;
    const isAccelerating = spd > 0.52;
    const targetOpacity = isAccelerating ? trailOpacity : st.trailIdleOpacity;
    smoothedOpacityRef.current = THREE.MathUtils.lerp(
      smoothedOpacityRef.current,
      targetOpacity,
      1 - Math.exp(-4 * delta)
    );

    // Update uniforms
    const col = new THREE.Color(trailColor);
    uniforms.uColor.value.set(col.r, col.g, col.b);
    uniforms.uOpacity.value = smoothedOpacityRef.current;
    uniforms.uGlow.value = trailGlow;
    const typeMap: Record<TrailType, number> = { solid: 0, dashed: 1, pulse: 2, double: 3 };
    uniforms.uTrailType.value = typeMap[st.trailType] ?? 0;
    uniforms.uTime.value += delta;

    const trailLen = Math.min(Math.round(trailLength), TRAIL_MAX_POINTS);
    const width = trailWidth;
    const fadeExp = trailFadeExp;

    // Get current tire world position
    const tirePos = tirePositionsRef.current[tireKey].clone();
    if (offset) tirePos.add(offset);

    // Initialize on first frame
    if (!initializedRef.current) {
      lastPosRef.current.copy(tirePos);
      initializedRef.current = true;
      return;
    }

    // Direction of travel
    const dir = new THREE.Vector3().subVectors(tirePos, lastPosRef.current);
    const dist = dir.length();

    // Only add a new point if we've moved enough
    if (dist >= 0.05) {
      dir.normalize();

      // Perpendicular vector in XZ plane for ribbon width
      const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

      // Prepend new point (index 0 = newest)
      trailPointsRef.current.unshift({
        x: tirePos.x,
        y: st.trailHeightOffset,
        z: tirePos.z,
        px: perp.x,
        pz: perp.z,
      });

      // Trim to max trail length
      if (trailPointsRef.current.length > trailLen) {
        trailPointsRef.current.length = trailLen;
      }

      lastPosRef.current.copy(tirePos);
    }

    // Rebuild geometry buffers from trail points (sequential order)
    const points = trailPointsRef.current;
    const count = points.length;
    const positions = geometry.attributes.position.array as Float32Array;
    const alphas = geometry.attributes.aAlpha.array as Float32Array;
    const tIdx = geometry.attributes.aTrailIndex.array as Float32Array;

    for (let i = 0; i < TRAIL_MAX_POINTS; i++) {
      if (i < count) {
        const pt = points[i];
        const age = count > 1 ? i / (count - 1) : 0;
        const a = Math.pow(1 - age, fadeExp);

        // Left edge
        const li = i * 2 * 3;
        positions[li] = pt.x + pt.px * width;
        positions[li + 1] = pt.y;
        positions[li + 2] = pt.z + pt.pz * width;

        // Right edge
        const ri = (i * 2 + 1) * 3;
        positions[ri] = pt.x - pt.px * width;
        positions[ri + 1] = pt.y;
        positions[ri + 2] = pt.z - pt.pz * width;

        alphas[i * 2] = a;
        alphas[i * 2 + 1] = a;
        tIdx[i * 2] = i;
        tIdx[i * 2 + 1] = i;
      } else {
        // Zero out unused slots
        const li = i * 2 * 3;
        positions[li] = positions[li + 1] = positions[li + 2] = 0;
        const ri = (i * 2 + 1) * 3;
        positions[ri] = positions[ri + 1] = positions[ri + 2] = 0;
        alphas[i * 2] = 0;
        alphas[i * 2 + 1] = 0;
        tIdx[i * 2] = 0;
        tIdx[i * 2 + 1] = 0;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
    geometry.attributes.aTrailIndex.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={trailVertexShader}
        fragmentShader={trailFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function TronTrails({
  tirePositionsRef,
}: {
  tirePositionsRef: React.MutableRefObject<TireWorldPositions>;
}) {
  const trailType = useTerrainStore((s) => s.trailType);
  const trailWidth = useTerrainStore((s) => s.trailWidth);

  // For "double" type, offset each ribbon slightly to create parallel lines
  const doubleOffset = trailWidth * 1.5;

  if (trailType === "double") {
    return (
      <>
        {(["rearLeft", "rearRight", "frontLeft", "frontRight"] as const).map((key) => {
          const front = key === "frontLeft" || key === "frontRight";
          return (
            <React.Fragment key={key}>
              <TronTrailRibbon
                tirePositionsRef={tirePositionsRef}
                tireKey={key}
                offset={new THREE.Vector3(doubleOffset, 0, 0)}
                isFront={front}
              />
              <TronTrailRibbon
                tirePositionsRef={tirePositionsRef}
                tireKey={key}
                offset={new THREE.Vector3(-doubleOffset, 0, 0)}
                isFront={front}
              />
            </React.Fragment>
          );
        })}
      </>
    );
  }

  return (
    <>
      <TronTrailRibbon tirePositionsRef={tirePositionsRef} tireKey="rearLeft" />
      <TronTrailRibbon tirePositionsRef={tirePositionsRef} tireKey="rearRight" />
      <TronTrailRibbon tirePositionsRef={tirePositionsRef} tireKey="frontLeft" isFront />
      <TronTrailRibbon tirePositionsRef={tirePositionsRef} tireKey="frontRight" isFront />
    </>
  );
}

/* ── Terrain mesh that follows the camera ────────────────────── */
function TerrainPoints({
  scrollZRef,
  carXRef,
  forwardSpeedRef,
}: {
  scrollZRef: React.MutableRefObject<number>;
  carXRef: React.MutableRefObject<number>;
  forwardSpeedRef: React.MutableRefObject<number>;
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
      uRoadTerrainFalloff: { value: terrainState.roadTerrainFalloff },
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
    [buildGeometry, terrainState.gridDensity, terrainState.farClip]
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
    scrollZRef.current -= forwardSpeedRef.current * delta;

    // ── Infinite scrolling: mesh stays at origin, shader wraps vertices ──
    u.uCameraZ.value = scrollZRef.current;
    u.uGridSize.value = t.farClip * 2;

    // Update uniforms
    u.uAmplitude.value = t.amplitude;
    u.uFrequency.value = t.frequency;
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
    u.uRoadTerrainFalloff.value = t.roadTerrainFalloff;
    u.uRoadCurveAmplitude.value = t.roadCurveAmplitude;
    u.uRoadCurveFrequency.value = t.roadCurveFrequency;

    // Footpath uniforms (terrain needs these for flattening + discard)
    u.uFootpathEnabled.value = t.footpathEnabled ? 1.0 : 0.0;
    u.uFootpathWidth.value = t.footpathWidth;
    u.uFootpathGap.value = t.footpathGap;
    u.uFootpathEdgeSoftness.value = t.footpathEdgeSoftness;

    u.uColorMid.value.copy(hexToVec3(t.colorMid));
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
    const camRoadCenterX = camCurveAmp * Math.sin(scrollZRef.current * camCurveFreq);
    // Perpendicular offset (same math as car)
    const camDxdz = camCurveAmp * camCurveFreq * Math.cos(scrollZRef.current * camCurveFreq);
    const camTangentLen = Math.sqrt(camDxdz * camDxdz + 1);
    const camPerpX = 1 / camTangentLen;
    const camWorldX = camRoadCenterX + carXRef.current * camPerpX;
    cameraLagX.current = THREE.MathUtils.lerp(
      cameraLagX.current,
      camWorldX,
      1 - Math.exp(-3 * delta)
    );

    // ── Dynamic camera based on acceleration ──────────────────
    const maxSpeed = t.moveSpeed;
    const accel = (forwardSpeedRef.current - prevSpeed.current) / Math.max(delta, 0.001);
    prevSpeed.current = forwardSpeedRef.current;

    // Normalize acceleration to roughly -1..1 range
    const accelNorm = THREE.MathUtils.clamp(accel / (maxSpeed * 2), -1, 1);
    // Normalize current speed to 0..1
    const speedNorm = Math.abs(forwardSpeedRef.current) / maxSpeed;

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
      scrollZRef.current + 10 + cameraZOffset.current
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
  scrollZRef,
}: {
  scrollZRef: React.MutableRefObject<number>;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const densityRef = useRef(200);
  const crossDensityRef = useRef(8);
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
      uFalloffStart: { value: terrainState.roadFalloffStart },
      uFalloffEnd: { value: terrainState.roadFalloffEnd },
      uPointSizeFalloff: { value: terrainState.roadPointSizeFalloff },
      uNearFade: { value: terrainState.roadNearFade },
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
    (density: number, crossDensity: number, far: number, roadW: number, fpGap: number, fpW: number) => {
      const stripHalfWidth = roadW * 0.5 + fpGap + fpW + 0.5; // +0.5 for edge softness
      const stripWidth = stripHalfWidth * 2;
      const stripLength = far * 2;
      const segZ = density;
      const segX = crossDensity;
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
        terrainState.roadCrossDensity,
        terrainState.farClip,
        terrainState.roadWidth,
        terrainState.footpathGap,
        terrainState.footpathWidth
      ),
    [
      buildRoadGeometry,
      terrainState.roadDensity,
      terrainState.roadCrossDensity,
      terrainState.farClip,
      terrainState.roadWidth,
      terrainState.footpathGap,
      terrainState.footpathWidth,
    ]
  );

  useFrame(() => {
    const t = useTerrainStore.getState();
    const u = uniformsRef.current;

    u.uCameraZ.value = scrollZRef.current;
    u.uGridSize.value = t.farClip * 2;
    u.uRoadCurveAmplitude.value = t.roadCurveAmplitude;
    u.uRoadCurveFrequency.value = t.roadCurveFrequency;
    u.uPointSize.value = t.roadPointSize;
    u.uFalloffStart.value = t.roadFalloffStart;
    u.uFalloffEnd.value = t.roadFalloffEnd;
    u.uPointSizeFalloff.value = t.roadPointSizeFalloff;
    u.uNearFade.value = t.roadNearFade;
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
      t.roadCrossDensity !== crossDensityRef.current ||
      t.farClip !== farClipRef.current ||
      t.roadWidth !== widthRef.current ||
      t.footpathWidth !== fpWidthRef.current ||
      t.footpathGap !== fpGapRef.current
    ) {
      densityRef.current = t.roadDensity;
      crossDensityRef.current = t.roadCrossDensity;
      farClipRef.current = t.farClip;
      widthRef.current = t.roadWidth;
      fpWidthRef.current = t.footpathWidth;
      fpGapRef.current = t.footpathGap;
      const newGeo = buildRoadGeometry(
        t.roadDensity,
        t.roadCrossDensity,
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
  const scrollZRef = useRef(0);
  const carXRef = useRef(0);
  const initialCruise = useTerrainStore.getState().moveSpeed * 0.5;
  const forwardSpeedRef = useRef(initialCruise);
  const keysRef = useKeyboard();
  const tirePositionsRef = useRef<TireWorldPositions>({
    rearLeft: new THREE.Vector3(),
    rearRight: new THREE.Vector3(),
    frontLeft: new THREE.Vector3(),
    frontRight: new THREE.Vector3(),
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, -2]} intensity={1} color="#ff66ff" />
      <TerrainPoints
        scrollZRef={scrollZRef}
        carXRef={carXRef}
        forwardSpeedRef={forwardSpeedRef}
      />
      <RoadPoints scrollZRef={scrollZRef} />
      <RetroCar
        scrollZRef={scrollZRef}
        carXRef={carXRef}
        forwardSpeedRef={forwardSpeedRef}
        keysRef={keysRef}
        tirePositionsRef={tirePositionsRef}
      />
      <TronTrails tirePositionsRef={tirePositionsRef} />
      <PostProcessingEffects />
    </>
  );
}

useGLTF.preload("/models/car_model_01/scene.gltf");

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
