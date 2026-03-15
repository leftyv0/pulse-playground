"use client";

import { useRef, useEffect } from "react";
import { useControls, folder, button, LevaPanel, useCreateStore } from "leva";
import { useTerrainStore, type NoiseType, type TrailType } from "@/store/terrainStore";

const NOISE_OPTIONS = {
  Perlin: "perlin",
  Simplex: "simplex",
  FBM: "fbm",
  Ridged: "ridged",
  Voronoi: "voronoi",
} as const;

const TRAIL_TYPE_OPTIONS = {
  Solid: "solid",
  Dashed: "dashed",
  Pulse: "pulse",
  Double: "double",
} as const;

export function TerrainControlPanel() {
  const levaStore = useCreateStore();
  const skipSync = useRef(false);
  const store = useTerrainStore;

  // Track preset names so dropdown re-renders when presets are added/deleted
  const presetNames = useTerrainStore((s) => Object.keys(s.presets).sort().join(","));

  useControls(
    () => {
      const userPresets = store.getState().presets;
      const presetOptions: Record<string, string> = { Default: "Default" };
      for (const name of Object.keys(userPresets)) {
        presetOptions[name] = name;
      }
      return {
      Presets: folder({
        "Active Preset": {
          value: store.getState().activePreset,
          options: presetOptions,
          onChange: (v: string) => {
            if (!skipSync.current) store.getState().loadPreset(v);
          },
        },
        "Save As New Preset": button(() => {
          const name = window.prompt("Preset name:");
          if (name && name.trim()) {
            store.getState().savePreset(name.trim());
          }
        }),
        "Reset to Default": button(() => {
          store.getState().resetToDefault();
        }),
        "Delete Active Preset": button(() => {
          const active = store.getState().activePreset;
          if (active === "Default") return;
          if (window.confirm(`Delete preset "${active}"?`)) {
            store.getState().deletePreset(active);
          }
        }),
      }, { collapsed: true }),
      "Noise Params": folder({
        "Noise Type": {
          value: store.getState().noiseType,
          options: NOISE_OPTIONS,
          onChange: (v: NoiseType) => {
            if (!skipSync.current) store.getState().setNoiseType(v);
          },
        },
        Amplitude: {
          value: store.getState().amplitude,
          min: 0,
          max: 20,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setAmplitude(v);
          },
        },
        Frequency: {
          value: store.getState().frequency,
          min: 0.01,
          max: 1,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setFrequency(v);
          },
        },
        Speed: {
          value: store.getState().speed,
          min: 0,
          max: 10,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setSpeed(v);
          },
        },
      }, { collapsed: true }),
      FBM: folder({
        Octaves: {
          value: store.getState().octaves,
          min: 1,
          max: 8,
          step: 1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setOctaves(v);
          },
        },
        Lacunarity: {
          value: store.getState().lacunarity,
          min: 1,
          max: 4,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setLacunarity(v);
          },
        },
        Gain: {
          value: store.getState().gain,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setGain(v);
          },
        },
      }, { collapsed: true }),
      Visual: folder({
        "Point Size": {
          value: store.getState().pointSize,
          min: 0.05,
          max: 8,
          step: 0.05,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setPointSize(v);
          },
        },
        "Grid Density": {
          value: store.getState().gridDensity,
          min: 64,
          max: 1024,
          step: 64,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setGridDensity(v);
          },
        },
        "Density Fall-off": folder({
          "Falloff Start": {
            value: store.getState().falloffStart,
            min: 0.05,
            max: 1.0,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setFalloffStart(v);
            },
          },
          "Falloff End": {
            value: store.getState().falloffEnd,
            min: 0.1,
            max: 1.0,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setFalloffEnd(v);
            },
          },
          "Size Falloff": {
            value: store.getState().pointSizeFalloff,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setPointSizeFalloff(v);
            },
          },
          "Near Fade": {
            value: store.getState().nearFade,
            min: 0,
            max: 0.3,
            step: 0.005,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setNearFade(v);
            },
          },
          "Lateral Falloff": {
            value: store.getState().lateralFalloff,
            min: 0,
            max: 2.0,
            step: 0.05,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setLateralFalloff(v);
            },
          },
        }, { collapsed: true }),
        "Color Low": {
          value: store.getState().colorLow,
          onChange: (v: string) => {
            if (!skipSync.current) store.getState().setColorLow(v);
          },
        },
        "Color Mid": {
          value: store.getState().colorMid,
          onChange: (v: string) => {
            if (!skipSync.current) store.getState().setColorMid(v);
          },
        },
        "Color High": {
          value: store.getState().colorHigh,
          onChange: (v: string) => {
            if (!skipSync.current) store.getState().setColorHigh(v);
          },
        },
        Opacity: {
          value: store.getState().opacity,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setOpacity(v);
          },
        },
      }, { collapsed: true }),
      Road: folder({
        Enabled: {
          value: store.getState().roadEnabled,
          onChange: (v: boolean) => {
            if (!skipSync.current) store.getState().setRoadEnabled(v);
          },
        },
        Width: {
          value: store.getState().roadWidth,
          min: 1,
          max: 20,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setRoadWidth(v);
          },
        },
        "Edge Softness": {
          value: store.getState().roadEdgeSoftness,
          min: 0,
          max: 1.5,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setRoadEdgeSoftness(v);
          },
        },
        "Terrain Falloff": {
          value: store.getState().roadTerrainFalloff,
          min: 0,
          max: 30,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setRoadTerrainFalloff(v);
          },
        },
        "Road Color": {
          value: store.getState().roadColor,
          onChange: (v: string) => {
            if (!skipSync.current) store.getState().setRoadColor(v);
          },
        },
        "Curve Amplitude": {
          value: store.getState().roadCurveAmplitude,
          min: 0,
          max: 30,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setRoadCurveAmplitude(v);
          },
        },
        "Curve Frequency": {
          value: store.getState().roadCurveFrequency,
          min: 0.01,
          max: 0.3,
          step: 0.005,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setRoadCurveFrequency(v);
          },
        },
        "Road Point Size": {
          value: store.getState().roadPointSize,
          min: 0.5,
          max: 8,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setRoadPointSize(v);
          },
        },
        Density: folder({
          "Length Segments": {
            value: store.getState().roadDensity,
            min: 32,
            max: 512,
            step: 16,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setRoadDensity(v);
            },
          },
          "Cross Segments": {
            value: store.getState().roadCrossDensity,
            min: 4,
            max: 64,
            step: 2,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setRoadCrossDensity(v);
            },
          },
        }, { collapsed: true }),
        "Road Fall-off": folder({
          "Road Falloff Start": {
            value: store.getState().roadFalloffStart,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setRoadFalloffStart(v);
            },
          },
          "Road Falloff End": {
            value: store.getState().roadFalloffEnd,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setRoadFalloffEnd(v);
            },
          },
          "Road Size Falloff": {
            value: store.getState().roadPointSizeFalloff,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setRoadPointSizeFalloff(v);
            },
          },
          "Road Near Fade": {
            value: store.getState().roadNearFade,
            min: 0,
            max: 0.5,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setRoadNearFade(v);
            },
          },
        }, { collapsed: true }),
      }, { collapsed: true }),
      Footpaths: folder({
        "FP Enabled": {
          value: store.getState().footpathEnabled,
          onChange: (v: boolean) => {
            if (!skipSync.current) store.getState().setFootpathEnabled(v);
          },
        },
        "FP Width": {
          value: store.getState().footpathWidth,
          min: 0.2,
          max: 3,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setFootpathWidth(v);
          },
        },
        "FP Gap": {
          value: store.getState().footpathGap,
          min: 0,
          max: 2,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setFootpathGap(v);
          },
        },
        "FP Edge Softness": {
          value: store.getState().footpathEdgeSoftness,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setFootpathEdgeSoftness(v);
          },
        },
        "FP Color": {
          value: store.getState().footpathColor,
          onChange: (v: string) => {
            if (!skipSync.current) store.getState().setFootpathColor(v);
          },
        },
      }, { collapsed: true }),
      Steering: folder({
        Sensitivity: {
          value: store.getState().steerSensitivity,
          min: 1,
          max: 12,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setSteerSensitivity(v);
          },
        },
        "Return Speed": {
          value: store.getState().steerReturnSpeed,
          min: 0,
          max: 5,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setSteerReturnSpeed(v);
          },
        },
        "Max Lateral": {
          value: store.getState().steerMaxLateralOffset,
          min: 0.2,
          max: 5,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setSteerMaxLateralOffset(v);
          },
        },
        "Surge Distance": {
          value: store.getState().surgeDistance,
          min: 0,
          max: 10,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setSurgeDistance(v);
          },
        },
        "Surge Smoothing": {
          value: store.getState().surgeSmoothing,
          min: 1,
          max: 12,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setSurgeSmoothing(v);
          },
        },
      }, { collapsed: true }),
      Drift: folder({
        "Drift Enabled": {
          value: store.getState().driftEnabled,
          onChange: (v: boolean) => {
            if (!skipSync.current) store.getState().setDriftEnabled(v);
          },
        },
        "Slide Amount": {
          value: store.getState().driftGripLoss,
          min: 0.1,
          max: 1.0,
          step: 0.05,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setDriftGripLoss(v);
          },
        },
        "Slip Speed": {
          value: store.getState().driftSlipRate,
          min: 0.5,
          max: 8.0,
          step: 0.25,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setDriftSlipRate(v);
          },
        },
        Recovery: {
          value: store.getState().driftRecovery,
          min: 0.5,
          max: 10.0,
          step: 0.25,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setDriftRecovery(v);
          },
        },
        "Max Angle": {
          value: store.getState().driftMaxAngle,
          min: 0.1,
          max: 1.2,
          step: 0.05,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setDriftMaxAngle(v);
          },
        },
        "Body Lean": {
          value: store.getState().driftLeanMultiplier,
          min: 0.5,
          max: 5.0,
          step: 0.25,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setDriftLeanMultiplier(v);
          },
        },
        "Lean Max Angle": {
          value: store.getState().bodyLeanMax,
          min: 0.02,
          max: 0.5,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setBodyLeanMax(v);
          },
        },
        "Yaw Max Angle": {
          value: store.getState().bodyYawMax,
          min: 0.01,
          max: 0.3,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setBodyYawMax(v);
          },
        },
        "Lean Smoothing": {
          value: store.getState().bodyLeanSmoothing,
          min: 1,
          max: 20,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setBodyLeanSmoothing(v);
          },
        },
        "Lean Return": {
          value: store.getState().bodyLeanReturnSmoothing,
          min: 1,
          max: 20,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setBodyLeanReturnSmoothing(v);
          },
        },
        "Lateral Range": {
          value: store.getState().lateralRange,
          min: 0.2,
          max: 3.0,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setLateralRange(v);
          },
        },
      }, { collapsed: true }),
      "Car Colors": folder({
        "Body": folder({
          ...Object.fromEntries(
            ["Body Paint", "Chassis"].map((k) => [
              k,
              {
                value: store.getState().carMaterialColors[k] ?? "#ffffff",
                onChange: (v: string) => {
                  if (!skipSync.current) store.getState().setCarMaterialColor(k, v);
                },
              },
            ])
          ),
        }, { collapsed: true }),
        "Glass": folder({
          ...Object.fromEntries(
            ["Glass"].map((k) => [
              k,
              {
                value: store.getState().carMaterialColors[k] ?? "#ffffff",
                onChange: (v: string) => {
                  if (!skipSync.current) store.getState().setCarMaterialColor(k, v);
                },
              },
            ])
          ),
        }, { collapsed: true }),
        "Lights": folder({
          ...Object.fromEntries(
            ["Headlight Housing", "Headlight Refractor", "Taillight Glass", "Indicator Glass", "Rear Refractor"].flatMap((k) => {
              const emissive = store.getState().carEmissiveSettings[k];
              return [
                [k, {
                  value: store.getState().carMaterialColors[k] ?? "#ffffff",
                  onChange: (v: string) => {
                    if (!skipSync.current) store.getState().setCarMaterialColor(k, v);
                  },
                }],
                ...(emissive ? [
                  [`${k} Emissive`, {
                    value: emissive.color,
                    onChange: (v: string) => {
                      if (!skipSync.current) store.getState().setCarEmissiveColor(k, v);
                    },
                  }],
                  [`${k} Intensity`, {
                    value: emissive.intensity,
                    min: 0,
                    max: 10,
                    step: 0.1,
                    onChange: (v: number) => {
                      if (!skipSync.current) store.getState().setCarEmissiveIntensity(k, v);
                    },
                  }],
                ] : []),
              ];
            })
          ),
        }, { collapsed: true }),
        "Wheels": folder({
          ...Object.fromEntries(
            ["Wheel Rims", "Tyres", "Brake Rotors"].map((k) => [
              k,
              {
                value: store.getState().carMaterialColors[k] ?? "#ffffff",
                onChange: (v: string) => {
                  if (!skipSync.current) store.getState().setCarMaterialColor(k, v);
                },
              },
            ])
          ),
        }, { collapsed: true }),
        "Trim": folder({
          ...Object.fromEntries(
            ["Chrome", "Badges", "Grille", "Matte Black", "Glossy Black"].map((k) => [
              k,
              {
                value: store.getState().carMaterialColors[k] ?? "#ffffff",
                onChange: (v: string) => {
                  if (!skipSync.current) store.getState().setCarMaterialColor(k, v);
                },
              },
            ])
          ),
        }, { collapsed: true }),
        "Interior": folder({
          ...Object.fromEntries(
            ["Interior", "Screen"].map((k) => [
              k,
              {
                value: store.getState().carMaterialColors[k] ?? "#ffffff",
                onChange: (v: string) => {
                  if (!skipSync.current) store.getState().setCarMaterialColor(k, v);
                },
              },
            ])
          ),
        }, { collapsed: true }),
      }, { collapsed: true }),
      "Tron Trails": folder({
        "Trail Enabled": {
          value: store.getState().trailEnabled,
          onChange: (v: boolean) => {
            if (!skipSync.current) store.getState().setTrailEnabled(v);
          },
        },
        "Trail Color": {
          value: store.getState().trailColor,
          onChange: (v: string) => {
            if (!skipSync.current) store.getState().setTrailColor(v);
          },
        },
        "Trail Type": {
          value: store.getState().trailType,
          options: TRAIL_TYPE_OPTIONS,
          onChange: (v: TrailType) => {
            if (!skipSync.current) store.getState().setTrailType(v);
          },
        },
        "Trail Width": {
          value: store.getState().trailWidth,
          min: 0.01,
          max: 0.5,
          step: 0.01,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setTrailWidth(v);
          },
        },
        "Trail Length": {
          value: store.getState().trailLength,
          min: 10,
          max: 500,
          step: 10,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setTrailLength(v);
          },
        },
        "Trail Opacity": {
          value: store.getState().trailOpacity,
          min: 0,
          max: 1,
          step: 0.05,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setTrailOpacity(v);
          },
        },
        "Trail Glow": {
          value: store.getState().trailGlow,
          min: 0,
          max: 10,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setTrailGlow(v);
          },
        },
        "Fade Exponent": {
          value: store.getState().trailFadeExponent,
          min: 0.5,
          max: 5,
          step: 0.25,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setTrailFadeExponent(v);
          },
        },
        "Idle Opacity": {
          value: store.getState().trailIdleOpacity,
          min: 0,
          max: 1,
          step: 0.05,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setTrailIdleOpacity(v);
          },
        },
        "Height Offset": {
          value: store.getState().trailHeightOffset,
          min: -0.1,
          max: 0.5,
          step: 0.005,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setTrailHeightOffset(v);
          },
        },
        "Front Wheels": folder({
          "Front Enabled": {
            value: store.getState().trailFrontEnabled,
            onChange: (v: boolean) => {
              if (!skipSync.current) store.getState().setTrailFrontEnabled(v);
            },
          },
          "Front Color": {
            value: store.getState().trailFrontColor,
            onChange: (v: string) => {
              if (!skipSync.current) store.getState().setTrailFrontColor(v);
            },
          },
          "Front Width": {
            value: store.getState().trailFrontWidth,
            min: 0.01,
            max: 0.5,
            step: 0.01,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setTrailFrontWidth(v);
            },
          },
          "Front Length": {
            value: store.getState().trailFrontLength,
            min: 10,
            max: 500,
            step: 10,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setTrailFrontLength(v);
            },
          },
          "Front Opacity": {
            value: store.getState().trailFrontOpacity,
            min: 0,
            max: 1,
            step: 0.05,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setTrailFrontOpacity(v);
            },
          },
          "Front Glow": {
            value: store.getState().trailFrontGlow,
            min: 0,
            max: 10,
            step: 0.5,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setTrailFrontGlow(v);
            },
          },
          "Front Fade Exp": {
            value: store.getState().trailFrontFadeExponent,
            min: 0.5,
            max: 5,
            step: 0.25,
            onChange: (v: number) => {
              if (!skipSync.current) store.getState().setTrailFrontFadeExponent(v);
            },
          },
        }, { collapsed: true }),
      }, { collapsed: true }),
      Camera: folder({
        Height: {
          value: store.getState().cameraHeight,
          min: 1,
          max: 30,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setCameraHeight(v);
          },
        },
        Tilt: {
          value: store.getState().cameraTilt,
          min: -1.5,
          max: 0,
          step: 0.05,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setCameraTilt(v);
          },
        },
        "Fly Speed": {
          value: store.getState().flySpeed,
          min: 0,
          max: 20,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setFlySpeed(v);
          },
        },
        "Move Speed": {
          value: store.getState().moveSpeed,
          min: 1,
          max: 50,
          step: 1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setMoveSpeed(v);
          },
        },
        "Far Clip": {
          value: store.getState().farClip,
          min: 50,
          max: 1000,
          step: 10,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setFarClip(v);
          },
        },
        "Dyn Tilt": {
          value: store.getState().dynTiltStrength,
          min: 0,
          max: 3,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setDynTiltStrength(v);
          },
        },
        "Dyn Height": {
          value: store.getState().dynHeightStrength,
          min: 0,
          max: 3,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setDynHeightStrength(v);
          },
        },
        "Dyn Z Pull": {
          value: store.getState().dynZStrength,
          min: 0,
          max: 3,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setDynZStrength(v);
          },
        },
        "Dyn Smoothing": {
          value: store.getState().dynSmoothing,
          min: 1,
          max: 10,
          step: 0.5,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setDynSmoothing(v);
          },
        },
      }, { collapsed: true }),
    }},
    { store: levaStore },
    [presetNames]
  );

  // Sync Zustand → Leva
  useEffect(() => {
    return useTerrainStore.subscribe((state) => {
      skipSync.current = true;
      try {
      levaStore.setValueAtPath("Presets.Active Preset", state.activePreset, false);
      levaStore.setValueAtPath("Noise Params.Noise Type", state.noiseType, false);
      levaStore.setValueAtPath("Noise Params.Amplitude", state.amplitude, false);
      levaStore.setValueAtPath("Noise Params.Frequency", state.frequency, false);
      levaStore.setValueAtPath("Noise Params.Speed", state.speed, false);
      levaStore.setValueAtPath("FBM.Octaves", state.octaves, false);
      levaStore.setValueAtPath("FBM.Lacunarity", state.lacunarity, false);
      levaStore.setValueAtPath("FBM.Gain", state.gain, false);
      levaStore.setValueAtPath("Visual.Point Size", state.pointSize, false);
      levaStore.setValueAtPath("Visual.Grid Density", state.gridDensity, false);
      levaStore.setValueAtPath("Visual.Density Fall-off.Falloff Start", state.falloffStart, false);
      levaStore.setValueAtPath("Visual.Density Fall-off.Falloff End", state.falloffEnd, false);
      levaStore.setValueAtPath("Visual.Density Fall-off.Size Falloff", state.pointSizeFalloff, false);
      levaStore.setValueAtPath("Visual.Density Fall-off.Near Fade", state.nearFade, false);
      levaStore.setValueAtPath("Visual.Density Fall-off.Lateral Falloff", state.lateralFalloff, false);
      levaStore.setValueAtPath("Visual.Color Low", state.colorLow, false);
      levaStore.setValueAtPath("Visual.Color Mid", state.colorMid, false);
      levaStore.setValueAtPath("Visual.Color High", state.colorHigh, false);
      levaStore.setValueAtPath("Visual.Opacity", state.opacity, false);
      levaStore.setValueAtPath("Road.Enabled", state.roadEnabled, false);
      levaStore.setValueAtPath("Road.Width", state.roadWidth, false);
      levaStore.setValueAtPath("Road.Edge Softness", state.roadEdgeSoftness, false);
      levaStore.setValueAtPath("Road.Terrain Falloff", state.roadTerrainFalloff, false);
      levaStore.setValueAtPath("Road.Road Color", state.roadColor, false);
      levaStore.setValueAtPath("Road.Curve Amplitude", state.roadCurveAmplitude, false);
      levaStore.setValueAtPath("Road.Curve Frequency", state.roadCurveFrequency, false);
      levaStore.setValueAtPath("Road.Road Point Size", state.roadPointSize, false);
      levaStore.setValueAtPath("Road.Density.Length Segments", state.roadDensity, false);
      levaStore.setValueAtPath("Road.Density.Cross Segments", state.roadCrossDensity, false);
      levaStore.setValueAtPath("Road.Road Fall-off.Road Falloff Start", state.roadFalloffStart, false);
      levaStore.setValueAtPath("Road.Road Fall-off.Road Falloff End", state.roadFalloffEnd, false);
      levaStore.setValueAtPath("Road.Road Fall-off.Road Size Falloff", state.roadPointSizeFalloff, false);
      levaStore.setValueAtPath("Road.Road Fall-off.Road Near Fade", state.roadNearFade, false);
      levaStore.setValueAtPath("Footpaths.FP Enabled", state.footpathEnabled, false);
      levaStore.setValueAtPath("Footpaths.FP Width", state.footpathWidth, false);
      levaStore.setValueAtPath("Footpaths.FP Gap", state.footpathGap, false);
      levaStore.setValueAtPath("Footpaths.FP Edge Softness", state.footpathEdgeSoftness, false);
      levaStore.setValueAtPath("Footpaths.FP Color", state.footpathColor, false);
      levaStore.setValueAtPath("Steering.Sensitivity", state.steerSensitivity, false);
      levaStore.setValueAtPath("Steering.Return Speed", state.steerReturnSpeed, false);
      levaStore.setValueAtPath("Steering.Max Lateral", state.steerMaxLateralOffset, false);
      levaStore.setValueAtPath("Steering.Surge Distance", state.surgeDistance, false);
      levaStore.setValueAtPath("Steering.Surge Smoothing", state.surgeSmoothing, false);
      levaStore.setValueAtPath("Drift.Drift Enabled", state.driftEnabled, false);
      levaStore.setValueAtPath("Drift.Slide Amount", state.driftGripLoss, false);
      levaStore.setValueAtPath("Drift.Slip Speed", state.driftSlipRate, false);
      levaStore.setValueAtPath("Drift.Recovery", state.driftRecovery, false);
      levaStore.setValueAtPath("Drift.Max Angle", state.driftMaxAngle, false);
      levaStore.setValueAtPath("Drift.Body Lean", state.driftLeanMultiplier, false);
      levaStore.setValueAtPath("Drift.Lean Max Angle", state.bodyLeanMax, false);
      levaStore.setValueAtPath("Drift.Yaw Max Angle", state.bodyYawMax, false);
      levaStore.setValueAtPath("Drift.Lean Smoothing", state.bodyLeanSmoothing, false);
      levaStore.setValueAtPath("Drift.Lean Return", state.bodyLeanReturnSmoothing, false);
      levaStore.setValueAtPath("Drift.Lateral Range", state.lateralRange, false);
      // Sync car material colors
      const matColors = state.carMaterialColors;
      const carColorGroups: Record<string, string[]> = {
        Body: ["Body Paint", "Chassis"],
        Glass: ["Glass"],
        Lights: ["Headlight Housing", "Headlight Refractor", "Taillight Glass", "Indicator Glass", "Rear Refractor"],
        Wheels: ["Wheel Rims", "Tyres", "Brake Rotors"],
        Trim: ["Chrome", "Badges", "Grille", "Matte Black", "Glossy Black"],
        Interior: ["Interior", "Screen"],
      };
      const emissiveSettings = state.carEmissiveSettings;
      for (const [group, labels] of Object.entries(carColorGroups)) {
        for (const label of labels) {
          if (matColors[label]) {
            levaStore.setValueAtPath(`Car Colors.${group}.${label}`, matColors[label], false);
          }
          if (emissiveSettings[label]) {
            levaStore.setValueAtPath(`Car Colors.${group}.${label} Emissive`, emissiveSettings[label].color, false);
            levaStore.setValueAtPath(`Car Colors.${group}.${label} Intensity`, emissiveSettings[label].intensity, false);
          }
        }
      }
      levaStore.setValueAtPath("Tron Trails.Trail Enabled", state.trailEnabled, false);
      levaStore.setValueAtPath("Tron Trails.Trail Color", state.trailColor, false);
      levaStore.setValueAtPath("Tron Trails.Trail Type", state.trailType, false);
      levaStore.setValueAtPath("Tron Trails.Trail Width", state.trailWidth, false);
      levaStore.setValueAtPath("Tron Trails.Trail Length", state.trailLength, false);
      levaStore.setValueAtPath("Tron Trails.Trail Opacity", state.trailOpacity, false);
      levaStore.setValueAtPath("Tron Trails.Trail Glow", state.trailGlow, false);
      levaStore.setValueAtPath("Tron Trails.Fade Exponent", state.trailFadeExponent, false);
      levaStore.setValueAtPath("Tron Trails.Idle Opacity", state.trailIdleOpacity, false);
      levaStore.setValueAtPath("Tron Trails.Height Offset", state.trailHeightOffset, false);
      levaStore.setValueAtPath("Tron Trails.Front Wheels.Front Enabled", state.trailFrontEnabled, false);
      levaStore.setValueAtPath("Tron Trails.Front Wheels.Front Color", state.trailFrontColor, false);
      levaStore.setValueAtPath("Tron Trails.Front Wheels.Front Width", state.trailFrontWidth, false);
      levaStore.setValueAtPath("Tron Trails.Front Wheels.Front Length", state.trailFrontLength, false);
      levaStore.setValueAtPath("Tron Trails.Front Wheels.Front Opacity", state.trailFrontOpacity, false);
      levaStore.setValueAtPath("Tron Trails.Front Wheels.Front Glow", state.trailFrontGlow, false);
      levaStore.setValueAtPath("Tron Trails.Front Wheels.Front Fade Exp", state.trailFrontFadeExponent, false);
      levaStore.setValueAtPath("Camera.Height", state.cameraHeight, false);
      levaStore.setValueAtPath("Camera.Tilt", state.cameraTilt, false);
      levaStore.setValueAtPath("Camera.Fly Speed", state.flySpeed, false);
      levaStore.setValueAtPath("Camera.Move Speed", state.moveSpeed, false);
      levaStore.setValueAtPath("Camera.Far Clip", state.farClip, false);
      levaStore.setValueAtPath("Camera.Dyn Tilt", state.dynTiltStrength, false);
      levaStore.setValueAtPath("Camera.Dyn Height", state.dynHeightStrength, false);
      levaStore.setValueAtPath("Camera.Dyn Z Pull", state.dynZStrength, false);
      levaStore.setValueAtPath("Camera.Dyn Smoothing", state.dynSmoothing, false);
      } catch { /* leva store not yet ready */ }
      skipSync.current = false;
    });
  }, [levaStore]);

  return (
    <div className="leva-scrollable">
      <LevaPanel
        store={levaStore}
        flat={false}
        titleBar={{ title: "Terrain" }}
        fill
        theme={{
          colors: {
            elevation1: "#0a0a0f",
            elevation2: "#111118",
            elevation3: "#1a1a24",
            accent1: "#22d3ee",
            accent2: "#22d3ee",
            accent3: "#22d3ee",
            highlight1: "#ffffff",
            highlight2: "#b0b0b0",
            highlight3: "#808080",
          },
          fontSizes: { root: "10px" },
          sizes: { rootWidth: "260px", controlWidth: "130px" },
        }}
      />
    </div>
  );
}

