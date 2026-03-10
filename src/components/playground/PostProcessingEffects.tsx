"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePostProcessingStore } from "@/store/postProcessingStore";
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import {
  BloomEffect as BloomFX,
  BrightnessContrastEffect as BrightnessContrastFX,
  ChromaticAberrationEffect as ChromaticAberrationFX,
  ColorDepthEffect as ColorDepthFX,
  DepthOfFieldEffect as DepthOfFieldFX,
  DotScreenEffect as DotScreenFX,
  GlitchEffect as GlitchFX,
  HueSaturationEffect as HueSaturationFX,
  NoiseEffect as NoiseFX,
  PixelationEffect as PixelationFX,
  ScanlineEffect as ScanlineFX,
  SepiaEffect as SepiaFX,
  ToneMappingEffect as ToneMappingFX,
  VignetteEffect as VignetteFX,
  BlendFunction,
  GlitchMode,
  ToneMappingMode,
} from "postprocessing";
import { useThree } from "@react-three/fiber";
import { Vector2 } from "three";

// Helper: subscribe to specific store keys and run callback synchronously on change
function useSyncEffect(
  keys: string[],
  apply: (state: ReturnType<typeof usePostProcessingStore.getState>) => void
) {
  const applyRef = useRef(apply);
  applyRef.current = apply;

  useEffect(() => {
    // Apply initial values
    applyRef.current(usePostProcessingStore.getState());

    return usePostProcessingStore.subscribe((state, prev) => {
      const s = state as unknown as Record<string, unknown>;
      const p = prev as unknown as Record<string, unknown>;
      for (const k of keys) {
        if (s[k] !== p[k]) {
          applyRef.current(state);
          return;
        }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── Effect sub-components ──────────────────────────────────────
// Each creates its effect instance once and mutates it directly via subscription.

function BloomEffect() {
  const s = usePostProcessingStore.getState();
  const effect = useMemo(
    () =>
      new BloomFX({
        intensity: s.bloomIntensity * s.bloomAmount,
        luminanceThreshold: s.bloomThreshold,
        luminanceSmoothing: s.bloomSmoothing,
        mipmapBlur: s.bloomMipmapBlur,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(
    ["bloomAmount", "bloomIntensity", "bloomThreshold", "bloomSmoothing", "bloomLevels", "bloomMipmapBlur"],
    (st) => {
      effect.intensity = st.bloomIntensity * st.bloomAmount;
      effect.luminanceMaterial.threshold = st.bloomThreshold;
      effect.luminanceMaterial.smoothing = st.bloomSmoothing;
    }
  );

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

function BrightnessContrastEffect() {
  const s = usePostProcessingStore.getState();
  const effect = useMemo(
    () =>
      new BrightnessContrastFX({
        brightness: s.brightness * s.brightnessContrastAmount,
        contrast: s.contrast * s.brightnessContrastAmount,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(
    ["brightnessContrastAmount", "brightness", "contrast"],
    (st) => {
      effect.brightness = st.brightness * st.brightnessContrastAmount;
      effect.contrast = st.contrast * st.brightnessContrastAmount;
    }
  );

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

function ChromaticAberrationEffect() {
  const s = usePostProcessingStore.getState();
  const offset = s.chromaticAberrationOffset * s.chromaticAberrationAmount;
  const effect = useMemo(
    () =>
      new ChromaticAberrationFX({
        offset: new Vector2(offset, offset),
        radialModulation: s.chromaticAberrationRadialModulation,
        modulationOffset: s.chromaticAberrationModulationOffset,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(
    [
      "chromaticAberrationAmount",
      "chromaticAberrationOffset",
      "chromaticAberrationRadialModulation",
      "chromaticAberrationModulationOffset",
    ],
    (st) => {
      const o = st.chromaticAberrationOffset * st.chromaticAberrationAmount;
      effect.offset.set(o, o);
    }
  );

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

function ColorDepthEffect() {
  const s = usePostProcessingStore.getState();
  const bits = Math.round(24 - (24 - s.colorDepthBits) * s.colorDepthAmount);
  const effect = useMemo(
    () => new ColorDepthFX({ bits, blendFunction: BlendFunction.NORMAL }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(["colorDepthAmount", "colorDepthBits"], (st) => {
    (effect as unknown as { bitDepth: number }).bitDepth = Math.round(
      24 - (24 - st.colorDepthBits) * st.colorDepthAmount
    );
  });

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

function DepthOfFieldEffect() {
  const camera = useThree((s) => s.camera);
  const s = usePostProcessingStore.getState();
  const effect = useMemo(
    () =>
      new DepthOfFieldFX(camera, {
        focusDistance: s.dofFocusDistance,
        focalLength: s.dofFocalLength,
        bokehScale: s.dofBokehScale * s.depthOfFieldAmount,
      }),
    [camera] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(
    ["depthOfFieldAmount", "dofFocusDistance", "dofFocalLength", "dofBokehScale"],
    (st) => {
      effect.bokehScale = st.dofBokehScale * st.depthOfFieldAmount;
      effect.cocMaterial.focusDistance = st.dofFocusDistance;
      effect.cocMaterial.focalLength = st.dofFocalLength;
    }
  );

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

function DotScreenEffect() {
  const s = usePostProcessingStore.getState();
  const effect = useMemo(
    () =>
      new DotScreenFX({
        angle: s.dotScreenAngle,
        scale: s.dotScreenScale,
        blendFunction: BlendFunction.NORMAL,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(["dotScreenAmount", "dotScreenAngle", "dotScreenScale"], (st) => {
    effect.blendMode.opacity.value = st.dotScreenAmount;
  });

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

function GlitchEffect() {
  const s = usePostProcessingStore.getState();
  const effect = useMemo(
    () =>
      (() => {
        const fx = new GlitchFX({
          delay: new Vector2(s.glitchDelayMin, s.glitchDelayMax),
          duration: new Vector2(s.glitchDurationMin, s.glitchDurationMax),
          strength: new Vector2(
            s.glitchStrengthMin * s.glitchAmount,
            s.glitchStrengthMax * s.glitchAmount
          ),
          ratio: s.glitchRatio,
        });
        fx.mode = s.glitchMode as GlitchMode;
        return fx;
      })(),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(
    [
      "glitchAmount",
      "glitchStrengthMin",
      "glitchStrengthMax",
      "glitchDurationMin",
      "glitchDurationMax",
      "glitchDelayMin",
      "glitchDelayMax",
      "glitchRatio",
      "glitchMode",
    ],
    (st) => {
      effect.delay.set(st.glitchDelayMin, st.glitchDelayMax);
      effect.duration.set(st.glitchDurationMin, st.glitchDurationMax);
      effect.strength.set(
        st.glitchStrengthMin * st.glitchAmount,
        st.glitchStrengthMax * st.glitchAmount
      );
      effect.mode = st.glitchMode as GlitchMode;
      effect.ratio = st.glitchRatio;
    }
  );

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

function HueSaturationEffect() {
  const s = usePostProcessingStore.getState();
  const effect = useMemo(
    () =>
      new HueSaturationFX({
        hue: s.hue * s.hueSaturationAmount,
        saturation: s.saturation * s.hueSaturationAmount,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(["hueSaturationAmount", "hue", "saturation"], (st) => {
    effect.hue = st.hue * st.hueSaturationAmount;
    effect.saturation = st.saturation * st.hueSaturationAmount;
  });

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

function NoiseEffect() {
  const s = usePostProcessingStore.getState();
  const effect = useMemo(
    () =>
      new NoiseFX({
        premultiply: true,
        blendFunction: BlendFunction.ADD,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(["noiseAmount", "noiseOpacity"], (st) => {
    effect.blendMode.opacity.value = st.noiseOpacity * st.noiseAmount;
  });

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

function PixelationEffect() {
  const s = usePostProcessingStore.getState();
  const effect = useMemo(
    () => new PixelationFX(Math.round(s.pixelationGranularity * s.pixelationAmount)),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(["pixelationAmount", "pixelationGranularity"], (st) => {
    effect.granularity = Math.round(st.pixelationGranularity * st.pixelationAmount);
  });

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

function ScanlineEffect() {
  const s = usePostProcessingStore.getState();
  const effect = useMemo(
    () =>
      new ScanlineFX({
        blendFunction: BlendFunction.OVERLAY,
        density: s.scanlineDensity,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(["scanlineAmount", "scanlineDensity", "scanlineOpacity"], (st) => {
    effect.density = st.scanlineDensity;
    effect.blendMode.opacity.value = st.scanlineOpacity * st.scanlineAmount;
  });

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

function SepiaEffect() {
  const s = usePostProcessingStore.getState();
  const effect = useMemo(
    () =>
      new SepiaFX({
        intensity: s.sepiaIntensity * s.sepiaAmount,
        blendFunction: BlendFunction.NORMAL,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(["sepiaAmount", "sepiaIntensity"], (st) => {
    effect.intensity = st.sepiaIntensity * st.sepiaAmount;
  });

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

function ToneMappingEffect() {
  const s = usePostProcessingStore.getState();
  const effect = useMemo(
    () => new ToneMappingFX({ mode: s.toneMappingMode as ToneMappingMode }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(["toneMappingMode"], (st) => {
    effect.mode = st.toneMappingMode as ToneMappingMode;
  });

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

function VignetteEffect() {
  const s = usePostProcessingStore.getState();
  const effect = useMemo(
    () =>
      new VignetteFX({
        offset: s.vignetteOffset,
        darkness: s.vignetteDarkness * s.vignetteAmount,
        blendFunction: BlendFunction.NORMAL,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useSyncEffect(["vignetteAmount", "vignetteOffset", "vignetteDarkness"], (st) => {
    effect.offset = st.vignetteOffset;
    effect.darkness = st.vignetteDarkness * st.vignetteAmount;
  });

  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} />;
}

// ─── Main EffectComposer wrapper ────────────────────────────────

export function PostProcessingEffects() {
  const bloomAmount = usePostProcessingStore((s) => s.bloomAmount);
  const brightnessContrastAmount = usePostProcessingStore(
    (s) => s.brightnessContrastAmount
  );
  const chromaticAberrationAmount = usePostProcessingStore(
    (s) => s.chromaticAberrationAmount
  );
  const colorDepthAmount = usePostProcessingStore((s) => s.colorDepthAmount);
  const depthOfFieldAmount = usePostProcessingStore(
    (s) => s.depthOfFieldAmount
  );
  const dotScreenAmount = usePostProcessingStore((s) => s.dotScreenAmount);
  const glitchAmount = usePostProcessingStore((s) => s.glitchAmount);
  const hueSaturationAmount = usePostProcessingStore(
    (s) => s.hueSaturationAmount
  );
  const noiseAmount = usePostProcessingStore((s) => s.noiseAmount);
  const pixelationAmount = usePostProcessingStore((s) => s.pixelationAmount);
  const scanlineAmount = usePostProcessingStore((s) => s.scanlineAmount);
  const sepiaAmount = usePostProcessingStore((s) => s.sepiaAmount);
  const smaaAmount = usePostProcessingStore((s) => s.smaaAmount);
  const toneMappingAmount = usePostProcessingStore((s) => s.toneMappingAmount);
  const vignetteAmount = usePostProcessingStore((s) => s.vignetteAmount);

  const hasAnyEffect =
    bloomAmount > 0 ||
    brightnessContrastAmount > 0 ||
    chromaticAberrationAmount > 0 ||
    colorDepthAmount > 0 ||
    depthOfFieldAmount > 0 ||
    dotScreenAmount > 0 ||
    glitchAmount > 0 ||
    hueSaturationAmount > 0 ||
    noiseAmount > 0 ||
    pixelationAmount > 0 ||
    scanlineAmount > 0 ||
    sepiaAmount > 0 ||
    smaaAmount > 0 ||
    toneMappingAmount > 0 ||
    vignetteAmount > 0;

  const composerKey = useMemo(
    () =>
      [
        bloomAmount,
        brightnessContrastAmount,
        chromaticAberrationAmount,
        colorDepthAmount,
        depthOfFieldAmount,
        dotScreenAmount,
        glitchAmount,
        hueSaturationAmount,
        noiseAmount,
        pixelationAmount,
        scanlineAmount,
        sepiaAmount,
        smaaAmount,
        toneMappingAmount,
        vignetteAmount,
      ]
        .map((v) => (v > 0 ? "1" : "0"))
        .join(""),
    [
      bloomAmount,
      brightnessContrastAmount,
      chromaticAberrationAmount,
      colorDepthAmount,
      depthOfFieldAmount,
      dotScreenAmount,
      glitchAmount,
      hueSaturationAmount,
      noiseAmount,
      pixelationAmount,
      scanlineAmount,
      sepiaAmount,
      smaaAmount,
      toneMappingAmount,
      vignetteAmount,
    ]
  );

  if (!hasAnyEffect) return null;

  const effects: React.JSX.Element[] = [];

  if (smaaAmount > 0) effects.push(<SMAA key="smaa" />);
  if (bloomAmount > 0) effects.push(<BloomEffect key="bloom" />);
  if (brightnessContrastAmount > 0)
    effects.push(<BrightnessContrastEffect key="bc" />);
  if (hueSaturationAmount > 0)
    effects.push(<HueSaturationEffect key="hs" />);
  if (toneMappingAmount > 0)
    effects.push(<ToneMappingEffect key="tm" />);
  if (chromaticAberrationAmount > 0)
    effects.push(<ChromaticAberrationEffect key="ca" />);
  if (depthOfFieldAmount > 0)
    effects.push(<DepthOfFieldEffect key="dof" />);
  if (vignetteAmount > 0) effects.push(<VignetteEffect key="vignette" />);
  if (noiseAmount > 0) effects.push(<NoiseEffect key="noise" />);
  if (scanlineAmount > 0) effects.push(<ScanlineEffect key="scanline" />);
  if (sepiaAmount > 0) effects.push(<SepiaEffect key="sepia" />);
  if (dotScreenAmount > 0) effects.push(<DotScreenEffect key="dot" />);
  if (pixelationAmount > 0) effects.push(<PixelationEffect key="pixel" />);
  if (colorDepthAmount > 0) effects.push(<ColorDepthEffect key="cd" />);
  if (glitchAmount > 0) effects.push(<GlitchEffect key="glitch" />);

  return (
    <EffectComposer key={composerKey} depthBuffer>
      {effects}
    </EffectComposer>
  );
}
