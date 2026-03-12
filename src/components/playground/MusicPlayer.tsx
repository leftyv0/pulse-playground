"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useAudioStore } from "@/store/audioStore";
import { usePlayerStore } from "@/store/playerStore";
import { useAudio } from "@/hooks/useAudio";
import { useTracks } from "@/hooks/useTracks";

export function MusicPlayer() {
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const currentTrack = useAudioStore((s) => s.currentTrack);

  const volume = usePlayerStore((s) => s.volume);
  const selectedTrackUrl = usePlayerStore((s) => s.selectedTrackUrl);
  const selectedTrackName = usePlayerStore((s) => s.selectedTrackName);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const setSelectedTrack = usePlayerStore((s) => s.setSelectedTrack);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  const audio = useAudio();
  const { tracks, loading, error } = useTracks();

  const tracksRef = useRef(tracks);
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  // Apply persisted volume on mount and whenever it changes
  useEffect(() => {
    audio.setVolume(volume);
  }, [volume, audio]);

  // Handle track ended — repeat / shuffle / advance
  const handleTrackEnded = useCallback(() => {
    const repeat = usePlayerStore.getState().repeat;
    const shuffle = usePlayerStore.getState().shuffle;
    const { selectedTrackUrl } = usePlayerStore.getState();
    const allTracks = tracksRef.current;

    if (repeat === "one") {
      const track = allTracks.find((t) => t.url === selectedTrackUrl);
      if (track) audio.play(track.url, track.name);
      return;
    }

    if (allTracks.length === 0) return;

    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * allTracks.length);
      const next = allTracks[randomIndex];
      usePlayerStore.getState().setSelectedTrack(next.url, next.name);
      audio.play(next.url, next.name);
      return;
    }

    // Sequential advance
    const currentIndex = allTracks.findIndex(
      (t) => t.url === selectedTrackUrl
    );
    const nextIndex = currentIndex + 1;

    if (nextIndex < allTracks.length) {
      const next = allTracks[nextIndex];
      usePlayerStore.getState().setSelectedTrack(next.url, next.name);
      audio.play(next.url, next.name);
    } else if (repeat === "all" && allTracks.length > 0) {
      const next = allTracks[0];
      usePlayerStore.getState().setSelectedTrack(next.url, next.name);
      audio.play(next.url, next.name);
    }
  }, [audio]);

  // Register the onEnded handler
  useEffect(() => {
    audio.onEnded(handleTrackEnded);
  }, [audio, handleTrackEnded]);

  const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = e.target.value;
    const track = tracks.find((t) => t.url === url);
    if (!track) return;
    setSelectedTrack(url, track.name);
    audio.play(url, track.name);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audio.pause();
    } else if (selectedTrackUrl) {
      if (currentTrack === selectedTrackName) {
        audio.resume();
      } else {
        audio.play(selectedTrackUrl, selectedTrackName);
      }
    }
  };

  // --- Playhead time tracking ---
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      if (!isSeeking) {
        setCurrentTime(audio.getCurrentTime());
        const d = audio.getDuration();
        if (d && isFinite(d)) setDuration(d);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [audio, isSeeking]);

  const formatTime = (t: number) => {
    if (!isFinite(t) || t < 0) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // --- Skip next / previous ---
  const skipNext = useCallback(() => {
    const { shuffle: shuf } = usePlayerStore.getState();
    const { selectedTrackUrl: url } = usePlayerStore.getState();
    const allTracks = tracksRef.current;
    if (allTracks.length === 0) return;

    if (shuf) {
      const rand = allTracks[Math.floor(Math.random() * allTracks.length)];
      usePlayerStore.getState().setSelectedTrack(rand.url, rand.name);
      audio.play(rand.url, rand.name);
      return;
    }

    const idx = allTracks.findIndex((t) => t.url === url);
    const next = allTracks[(idx + 1) % allTracks.length];
    usePlayerStore.getState().setSelectedTrack(next.url, next.name);
    audio.play(next.url, next.name);
  }, [audio]);

  const skipPrevious = useCallback(() => {
    // If more than 3s in, restart current track; otherwise go to previous
    if (audio.getCurrentTime() > 3) {
      audio.seek(0);
      return;
    }

    const { shuffle: shuf } = usePlayerStore.getState();
    const { selectedTrackUrl: url } = usePlayerStore.getState();
    const allTracks = tracksRef.current;
    if (allTracks.length === 0) return;

    if (shuf) {
      const rand = allTracks[Math.floor(Math.random() * allTracks.length)];
      usePlayerStore.getState().setSelectedTrack(rand.url, rand.name);
      audio.play(rand.url, rand.name);
      return;
    }

    const idx = allTracks.findIndex((t) => t.url === url);
    const prevIdx = idx <= 0 ? allTracks.length - 1 : idx - 1;
    const prev = allTracks[prevIdx];
    usePlayerStore.getState().setSelectedTrack(prev.url, prev.name);
    audio.play(prev.url, prev.name);
  }, [audio]);

  // --- Auto-load persisted track on mount ---
  const autoLoadedRef = useRef(false);
  useEffect(() => {
    if (autoLoadedRef.current || tracks.length === 0) return;
    const { selectedTrackUrl: url } = usePlayerStore.getState();
    if (url) {
      // Verify track still exists
      const found = tracks.find((t) => t.url === url);
      if (found) {
        autoLoadedRef.current = true;
        return; // Track is already set in persisted store, ready to play on user action
      }
    }
    // If no persisted track or it's gone, select the first track
    const first = tracks[0];
    usePlayerStore.getState().setSelectedTrack(first.url, first.name);
    autoLoadedRef.current = true;
  }, [tracks]);

  const isMuted = volume === 0;
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="fixed bottom-6 left-6 z-50 pointer-events-auto">
      <div
        className="flex flex-col rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"
        style={{ width: 320 }}
      >
        {/* Track info header */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-3">
          {/* Animated disc icon */}
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: isPlaying
                ? "linear-gradient(135deg, var(--color-accent), var(--color-primary))"
                : "rgba(255,255,255,0.06)",
              boxShadow: isPlaying ? "0 0 20px rgba(34, 211, 238, 0.2)" : "none",
              transition: "all 0.4s ease",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isPlaying ? "#fff" : "rgba(255,255,255,0.3)"} strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/30">
              {isPlaying ? "Now Playing" : "Paused"}
            </span>
            <span className="text-sm text-white/90 font-medium truncate leading-snug">
              {currentTrack ?? "No track selected"}
            </span>
          </div>
        </div>

        {/* Seek bar */}
        <div className="px-5 pb-1">
          <div
            className="group relative w-full h-5 flex items-center cursor-pointer"
            onMouseDown={() => setIsSeeking(true)}
            onMouseUp={() => setIsSeeking(false)}
            onTouchStart={() => setIsSeeking(true)}
            onTouchEnd={() => setIsSeeking(false)}
          >
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                const t = parseFloat(e.target.value);
                setCurrentTime(t);
                audio.seek(t);
              }}
              disabled={!selectedTrackUrl || duration === 0}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />
            {/* Track background */}
            <div className="w-full h-[3px] rounded-full bg-white/[0.08] overflow-hidden group-hover:h-[5px] transition-all duration-200">
              {/* Progress fill */}
              <div
                className="h-full rounded-full transition-[width] duration-100"
                style={{
                  width: `${progress * 100}%`,
                  background: selectedTrackUrl
                    ? "linear-gradient(90deg, var(--color-accent), var(--color-primary))"
                    : "rgba(255,255,255,0.1)",
                }}
              />
            </div>
            {/* Thumb dot — visible on hover */}
            {selectedTrackUrl && duration > 0 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_6px_rgba(34,211,238,0.4)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ left: `calc(${progress * 100}% - 6px)` }}
              />
            )}
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-white/25 font-mono tabular-nums">{formatTime(currentTime)}</span>
            <span className="text-[10px] text-white/25 font-mono tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-center gap-0.5 px-5 py-2">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className="p-2.5 rounded-full transition-all duration-200 hover:bg-white/[0.06]"
            title={`Shuffle: ${shuffle ? "On" : "Off"}`}
            style={{ color: shuffle ? "var(--color-accent)" : "rgba(255,255,255,0.25)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          </button>

          {/* Previous */}
          <button
            onClick={skipPrevious}
            disabled={!selectedTrackUrl}
            className="p-2.5 rounded-full transition-all duration-200 hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed"
            style={{ color: "rgba(255,255,255,0.7)" }}
            title="Previous"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="6" width="2.5" height="12" rx="0.5" />
              <polygon points="20,6 10,12 20,18" />
            </svg>
          </button>

          {/* Play / Pause — prominent center button */}
          <button
            onClick={handlePlayPause}
            disabled={!selectedTrackUrl}
            className="mx-2 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              background: selectedTrackUrl
                ? "linear-gradient(135deg, var(--color-accent), var(--color-primary))"
                : "rgba(255,255,255,0.06)",
              boxShadow: selectedTrackUrl && isPlaying
                ? "0 0 24px rgba(34, 211, 238, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)"
                : "inset 0 1px 0 rgba(255,255,255,0.1)",
              color: selectedTrackUrl ? "#fff" : "rgba(255,255,255,0.3)",
            }}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="7" y="5" width="3.5" height="14" rx="1" />
                <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="7,4 20,12 7,20" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={skipNext}
            disabled={!selectedTrackUrl}
            className="p-2.5 rounded-full transition-all duration-200 hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed"
            style={{ color: "rgba(255,255,255,0.7)" }}
            title="Next"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="4,6 14,12 4,18" />
              <rect x="17.5" y="6" width="2.5" height="12" rx="0.5" />
            </svg>
          </button>

          {/* Repeat */}
          <button
            onClick={cycleRepeat}
            className="relative p-2.5 rounded-full transition-all duration-200 hover:bg-white/[0.06]"
            title={`Repeat: ${repeat === "off" ? "Off" : repeat === "all" ? "All" : "One"}`}
            style={{ color: repeat !== "off" ? "var(--color-accent)" : "rgba(255,255,255,0.25)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            {repeat === "one" && (
              <span className="absolute top-0.5 -right-0 text-[8px] font-bold" style={{ color: "var(--color-accent)" }}>
                1
              </span>
            )}
          </button>
        </div>

        {/* Bottom bar: volume + track selector */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-white/[0.04] bg-white/[0.02]">
          {/* Volume */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setVolume(isMuted ? 0.5 : 0)}
              className="p-1 transition-colors duration-200 hover:bg-white/[0.06] rounded-md"
              style={{ color: "rgba(255,255,255,0.35)" }}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : volume < 0.5 ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                audio.setVolume(v);
              }}
              className="w-16 h-[3px] rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white/80
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-[0_0_4px_rgba(255,255,255,0.2)]"
              style={{
                background: `linear-gradient(to right, rgba(255,255,255,0.35) ${volume * 100}%, rgba(255,255,255,0.08) ${volume * 100}%)`,
              }}
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-white/[0.06]" />

          {/* Track selector */}
          <select
            value={selectedTrackUrl}
            onChange={handleTrackChange}
            className="flex-1 h-7 min-w-0 rounded-lg border border-white/[0.06] bg-white/[0.04] px-2 text-[11px] text-white/50 cursor-pointer truncate
              focus:outline-none focus:border-white/[0.12] hover:bg-white/[0.06] transition-colors duration-200
              [&>option]:bg-[#12121a] [&>option]:text-white/80"
          >
            {loading && <option value="">Loading...</option>}
            {error && <option value="">Error</option>}
            {tracks.map((track) => (
              <option key={track.url} value={track.url}>
                {track.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
