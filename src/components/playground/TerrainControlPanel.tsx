"use client";

import { useRef, useEffect } from "react";
import { useControls, folder, LevaPanel, useCreateStore } from "leva";
import { useTerrainStore, type NoiseType } from "@/store/terrainStore";

const NOISE_OPTIONS = {
  Perlin: "perlin",
  Simplex: "simplex",
  FBM: "fbm",
  Ridged: "ridged",
  Voronoi: "voronoi",
} as const;

const AUDIO_FEATURE_OPTIONS = {
  None: "none",
  Energy: "energy",
  RMS: "rms",
  Bass: "bass",
  Mid: "mid",
  Treble: "treble",
  Volume: "volume",
  "Spectral Centroid": "spectralCentroid",
  "Spectral Flux": "spectralFlux",
  "Spectral Flatness": "spectralFlatness",
  "Perceptual Sharpness": "perceptualSharpness",
  "Loudness Total": "loudnessTotal",
  ZCR: "zcr",
} as const;

export function TerrainControlPanel() {
  const levaStore = useCreateStore();
  const skipSync = useRef(false);
  const store = useTerrainStore;

  useControls(
    () => ({
      "Noise Type": {
        value: store.getState().noiseType,
        options: NOISE_OPTIONS,
        onChange: (v: NoiseType) => {
          if (!skipSync.current) store.getState().setNoiseType(v);
        },
      },
      "Noise Params": folder({
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
      }),
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
      }),
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
        }),
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
      }),
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
        "Road Density": {
          value: store.getState().roadDensity,
          min: 32,
          max: 512,
          step: 16,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setRoadDensity(v);
          },
        },
      }),
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
      }),
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
          min: 1,
          max: 20,
          step: 0.5,
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
      }),
      Drift: folder({
        Enabled: {
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
        "Lateral Range": {
          value: store.getState().lateralRange,
          min: 0.2,
          max: 3.0,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current) store.getState().setLateralRange(v);
          },
        },
      }),
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
      }),
      "Audio Mapping": folder({
        "Amp → Feature": {
          value: store.getState().audioAmplitude.feature,
          options: AUDIO_FEATURE_OPTIONS,
          onChange: (v: string) => {
            if (!skipSync.current)
              store
                .getState()
                .setAudioAmplitude({
                  ...store.getState().audioAmplitude,
                  feature: v,
                });
          },
        },
        "Amp → Sensitivity": {
          value: store.getState().audioAmplitude.sensitivity,
          min: 0,
          max: 20,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current)
              store
                .getState()
                .setAudioAmplitude({
                  ...store.getState().audioAmplitude,
                  sensitivity: v,
                });
          },
        },
        "Freq → Feature": {
          value: store.getState().audioFrequency.feature,
          options: AUDIO_FEATURE_OPTIONS,
          onChange: (v: string) => {
            if (!skipSync.current)
              store
                .getState()
                .setAudioFrequency({
                  ...store.getState().audioFrequency,
                  feature: v,
                });
          },
        },
        "Freq → Sensitivity": {
          value: store.getState().audioFrequency.sensitivity,
          min: 0,
          max: 20,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current)
              store
                .getState()
                .setAudioFrequency({
                  ...store.getState().audioFrequency,
                  sensitivity: v,
                });
          },
        },
        "Speed → Feature": {
          value: store.getState().audioSpeed.feature,
          options: AUDIO_FEATURE_OPTIONS,
          onChange: (v: string) => {
            if (!skipSync.current)
              store
                .getState()
                .setAudioSpeed({
                  ...store.getState().audioSpeed,
                  feature: v,
                });
          },
        },
        "Speed → Sensitivity": {
          value: store.getState().audioSpeed.sensitivity,
          min: 0,
          max: 20,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current)
              store
                .getState()
                .setAudioSpeed({
                  ...store.getState().audioSpeed,
                  sensitivity: v,
                });
          },
        },
        "Color → Feature": {
          value: store.getState().audioColor.feature,
          options: AUDIO_FEATURE_OPTIONS,
          onChange: (v: string) => {
            if (!skipSync.current)
              store
                .getState()
                .setAudioColor({
                  ...store.getState().audioColor,
                  feature: v,
                });
          },
        },
        "Color → Sensitivity": {
          value: store.getState().audioColor.sensitivity,
          min: 0,
          max: 20,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current)
              store
                .getState()
                .setAudioColor({
                  ...store.getState().audioColor,
                  sensitivity: v,
                });
          },
        },
        "Octaves → Feature": {
          value: store.getState().audioOctaves.feature,
          options: AUDIO_FEATURE_OPTIONS,
          onChange: (v: string) => {
            if (!skipSync.current)
              store
                .getState()
                .setAudioOctaves({
                  ...store.getState().audioOctaves,
                  feature: v,
                });
          },
        },
        "Octaves → Sensitivity": {
          value: store.getState().audioOctaves.sensitivity,
          min: 0,
          max: 20,
          step: 0.1,
          onChange: (v: number) => {
            if (!skipSync.current)
              store
                .getState()
                .setAudioOctaves({
                  ...store.getState().audioOctaves,
                  sensitivity: v,
                });
          },
        },
      }),
    }),
    { store: levaStore },
    []
  );

  // Sync Zustand → Leva
  useEffect(() => {
    return useTerrainStore.subscribe((state) => {
      skipSync.current = true;
      try {
      levaStore.setValueAtPath("Noise Type", state.noiseType, false);
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
      levaStore.setValueAtPath("Road.Road Color", state.roadColor, false);
      levaStore.setValueAtPath("Road.Curve Amplitude", state.roadCurveAmplitude, false);
      levaStore.setValueAtPath("Road.Curve Frequency", state.roadCurveFrequency, false);
      levaStore.setValueAtPath("Road.Road Point Size", state.roadPointSize, false);
      levaStore.setValueAtPath("Road.Road Density", state.roadDensity, false);
      levaStore.setValueAtPath("Footpaths.FP Enabled", state.footpathEnabled, false);
      levaStore.setValueAtPath("Footpaths.FP Width", state.footpathWidth, false);
      levaStore.setValueAtPath("Footpaths.FP Gap", state.footpathGap, false);
      levaStore.setValueAtPath("Footpaths.FP Edge Softness", state.footpathEdgeSoftness, false);
      levaStore.setValueAtPath("Footpaths.FP Color", state.footpathColor, false);
      levaStore.setValueAtPath("Steering.Sensitivity", state.steerSensitivity, false);
      levaStore.setValueAtPath("Steering.Return Speed", state.steerReturnSpeed, false);
      levaStore.setValueAtPath("Steering.Max Lateral", state.steerMaxLateralOffset, false);
      levaStore.setValueAtPath("Drift.Enabled", state.driftEnabled, false);
      levaStore.setValueAtPath("Drift.Slide Amount", state.driftGripLoss, false);
      levaStore.setValueAtPath("Drift.Slip Speed", state.driftSlipRate, false);
      levaStore.setValueAtPath("Drift.Recovery", state.driftRecovery, false);
      levaStore.setValueAtPath("Drift.Max Angle", state.driftMaxAngle, false);
      levaStore.setValueAtPath("Drift.Body Lean", state.driftLeanMultiplier, false);
      levaStore.setValueAtPath("Drift.Lateral Range", state.lateralRange, false);
      levaStore.setValueAtPath("Camera.Height", state.cameraHeight, false);
      levaStore.setValueAtPath("Camera.Tilt", state.cameraTilt, false);
      levaStore.setValueAtPath("Camera.Fly Speed", state.flySpeed, false);
      levaStore.setValueAtPath("Camera.Move Speed", state.moveSpeed, false);
      levaStore.setValueAtPath("Camera.Far Clip", state.farClip, false);
      levaStore.setValueAtPath("Camera.Dyn Tilt", state.dynTiltStrength, false);
      levaStore.setValueAtPath("Camera.Dyn Height", state.dynHeightStrength, false);
      levaStore.setValueAtPath("Camera.Dyn Z Pull", state.dynZStrength, false);
      levaStore.setValueAtPath("Camera.Dyn Smoothing", state.dynSmoothing, false);
      levaStore.setValueAtPath("Audio Mapping.Amp → Feature", state.audioAmplitude.feature, false);
      levaStore.setValueAtPath("Audio Mapping.Amp → Sensitivity", state.audioAmplitude.sensitivity, false);
      levaStore.setValueAtPath("Audio Mapping.Freq → Feature", state.audioFrequency.feature, false);
      levaStore.setValueAtPath("Audio Mapping.Freq → Sensitivity", state.audioFrequency.sensitivity, false);
      levaStore.setValueAtPath("Audio Mapping.Speed → Feature", state.audioSpeed.feature, false);
      levaStore.setValueAtPath("Audio Mapping.Speed → Sensitivity", state.audioSpeed.sensitivity, false);
      levaStore.setValueAtPath("Audio Mapping.Color → Feature", state.audioColor.feature, false);
      levaStore.setValueAtPath("Audio Mapping.Color → Sensitivity", state.audioColor.sensitivity, false);
      levaStore.setValueAtPath("Audio Mapping.Octaves → Feature", state.audioOctaves.feature, false);
      levaStore.setValueAtPath("Audio Mapping.Octaves → Sensitivity", state.audioOctaves.sensitivity, false);
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

