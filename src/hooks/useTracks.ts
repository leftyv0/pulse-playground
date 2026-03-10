"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Track {
  name: string;
  url: string;
}

const AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".aac", ".flac", ".webm"];

export function useTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTracks() {
      const { data, error: listError } = await supabase.storage
        .from("music-test")
        .list();

      if (listError) {
        setError(listError.message);
        setLoading(false);
        return;
      }

      const audioFiles = (data ?? []).filter((file) =>
        AUDIO_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
      );

      const mapped = audioFiles.map((file) => {
        const {
          data: { publicUrl },
        } = supabase.storage.from("music-test").getPublicUrl(file.name);
        return { name: file.name, url: publicUrl };
      });

      setTracks(mapped);
      setLoading(false);
    }

    fetchTracks();
  }, []);

  return { tracks, loading, error };
}
