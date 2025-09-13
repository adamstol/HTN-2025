"use client";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Maintains a rolling window of transcript text for the last N seconds.
 * Caller feeds partial text with timestamps; hook returns the current window.
 */
export type TranscriptChunk = {
  text: string;
  at: number; // ms since epoch
};

export function useRollingTranscript(windowSec: number = Number(process.env.NEXT_PUBLIC_SUGGESTION_WINDOW_SEC ?? process.env.SUGGESTION_WINDOW_SEC ?? 20)) {
  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const windowMs = windowSec * 1000;
  const nowRef = useRef<number>(Date.now());

  // prune periodically
  useEffect(() => {
    const id = setInterval(() => {
      nowRef.current = Date.now();
      setChunks((prev) => prev.filter((c) => nowRef.current - c.at <= windowMs));
    }, 1000);
    return () => clearInterval(id);
  }, [windowMs]);

  const addText = (text: string) => {
    if (!text?.trim()) return;
    setChunks((prev) => [...prev, { text, at: Date.now() }]);
  };

  const windowText = useMemo(() => chunks.map((c) => c.text).join(" ").trim(), [chunks]);

  const clear = () => setChunks([]);

  return { addText, windowText, clear, chunks };
}

