"use client";

import { useCallback, useRef } from "react";
import { useAudioStore } from "@/store/audioStore";
import {
  createMeydaAnalyzerFromElement,
  deriveBands,
  spectrumToUint8,
} from "@/lib/audio";
import type { MeydaFeaturesObject } from "@/lib/meydaTypes";
import { pushStats } from "@/lib/statsHistory";

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<{ stop(): void } | null>(null);
  const isSetupRef = useRef(false);
  const pendingOnEndedRef = useRef<(() => void) | null>(null);

  const setIsPlaying = useAudioStore((s) => s.setIsPlaying);
  const setCurrentTrack = useAudioStore((s) => s.setCurrentTrack);
  const setMeydaFeatures = useAudioStore((s) => s.setMeydaFeatures);

  const onFeatures = useCallback(
    (features: Partial<MeydaFeaturesObject>) => {
      const spectrum = features.amplitudeSpectrum;
      const bands = spectrum
        ? deriveBands(spectrum)
        : { bass: 0, mid: 0, treble: 0, volume: 0 };

      const frequencyData = spectrum
        ? spectrumToUint8(spectrum)
        : new Uint8Array(128);

      pushStats({
        bass: bands.bass,
        mid: bands.mid,
        treble: bands.treble,
        energy: (features.energy as number) || 0,
        rms: (features.rms as number) || 0,
        spectralCentroid: (features.spectralCentroid as number) || 0,
        spectralFlux: ((features as Record<string, unknown>).spectralFlux as number) || 0,
        spectralFlatness: (features.spectralFlatness as number) || 0,
        perceptualSharpness: (features.perceptualSharpness as number) || 0,
        zcr: (features.zcr as number) || 0,
      });

      setMeydaFeatures({
        frequencyData,
        bass: bands.bass,
        mid: bands.mid,
        treble: bands.treble,
        volume: bands.volume,
        spectralCentroid: (features.spectralCentroid as number) || 0,
        spectralCrest: (features.spectralCrest as number) || 0,
        spectralFlatness: (features.spectralFlatness as number) || 0,
        spectralFlux: ((features as Record<string, unknown>).spectralFlux as number) || 0,
        spectralKurtosis: (features.spectralKurtosis as number) || 0,
        spectralRolloff: (features.spectralRolloff as number) || 0,
        spectralSkewness: (features.spectralSkewness as number) || 0,
        spectralSlope: (features.spectralSlope as number) || 0,
        spectralSpread: (features.spectralSpread as number) || 0,
        energy: (features.energy as number) || 0,
        rms: (features.rms as number) || 0,
        zcr: (features.zcr as number) || 0,
        perceptualSharpness: (features.perceptualSharpness as number) || 0,
        perceptualSpread: (features.perceptualSpread as number) || 0,
        loudnessTotal: features.loudness?.total || 0,
        chroma: features.chroma ? Array.from(features.chroma) : Array(12).fill(0),
        mfcc: features.mfcc ? Array.from(features.mfcc) : Array(13).fill(0),
        amplitudeSpectrum: spectrum || new Float32Array(0),
      });
    },
    [setMeydaFeatures]
  );

  const ensureSetup = useCallback(async () => {
    if (isSetupRef.current) return;

    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const setup = await createMeydaAnalyzerFromElement(audio, onFeatures);
    ctxRef.current = setup.ctx;
    analyzerRef.current = setup.analyzer;
    setup.analyzer.start();

    if (pendingOnEndedRef.current) {
      audio.onended = pendingOnEndedRef.current;
      pendingOnEndedRef.current = null;
    }

    isSetupRef.current = true;
  }, [onFeatures]);

  const play = useCallback(
    async (url: string, trackName: string) => {
      await ensureSetup();

      if (ctxRef.current?.state === "suspended") {
        await ctxRef.current.resume();
      }

      const audio = audioRef.current!;
      audio.src = url;
      try {
        await audio.play();
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        throw e;
      }
      setIsPlaying(true);
      setCurrentTrack(trackName);
    },
    [ensureSetup, setIsPlaying, setCurrentTrack]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, [setIsPlaying]);

  const resume = useCallback(async () => {
    if (ctxRef.current?.state === "suspended") {
      await ctxRef.current.resume();
    }
    try {
      await audioRef.current?.play();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      throw e;
    }
    setIsPlaying(true);
  }, [setIsPlaying]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTrack(null);
  }, [setIsPlaying, setCurrentTrack]);

  const setVolume = useCallback((value: number) => {
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const getCurrentTime = useCallback(() => audioRef.current?.currentTime ?? 0, []);
  const getDuration = useCallback(() => audioRef.current?.duration ?? 0, []);

  const onEnded = useCallback((handler: () => void) => {
    const audio = audioRef.current;
    if (audio) {
      audio.onended = handler;
    } else {
      // Store for when audio is created
      pendingOnEndedRef.current = handler;
    }
  }, []);

  return { play, pause, resume, stop, setVolume, seek, getCurrentTime, getDuration, onEnded };
}
