"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Suggestion = { id: string; text: string };

export function LiveSuggestions(props: {
  transcriptWindow: string;
  intervalMs?: number;
  onUse?: (s: Suggestion) => void;
}) {
  const { transcriptWindow, onUse } = props;
  const intervalMs = props.intervalMs ?? Number(process.env.NEXT_PUBLIC_SUGGESTION_INTERVAL_MS ?? process.env.SUGGESTION_INTERVAL_MS ?? 4000);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [pinned, setPinned] = useState<Suggestion[]>([]);
  const lastBody = useRef<string>("");

  const fetchSuggestions = useCallback(async () => {
    if (!transcriptWindow?.trim()) return;
    const body = JSON.stringify({ transcriptWindow });
    if (body === lastBody.current) return; // avoid redundant POSTs if nothing changed
    lastBody.current = body;
    try {
      const res = await fetch("/api/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body });
      if (!res.ok) return;
      const data: { suggestions: string[] } = await res.json();
      const mapped = data.suggestions.map((text, idx) => ({ id: `${Date.now()}-${idx}`, text }));
      setItems(mapped);
    } catch {}
  }, [transcriptWindow]);

  useEffect(() => {
    const id = setInterval(fetchSuggestions, intervalMs);
    return () => clearInterval(id);
  }, [fetchSuggestions, intervalMs]);

  const shuffle = () => setItems((prev) => [...prev].sort(() => Math.random() - 0.5));
  const pin = (s: Suggestion) => setPinned((prev) => (prev.find((p) => p.id === s.id) ? prev : [s, ...prev]));
  const unpin = (id: string) => setPinned((prev) => prev.filter((p) => p.id !== id));

  const content = useMemo(() => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Live Suggestions</h3>
        <div className="flex items-center gap-2">
          <button className="text-xs underline" onClick={shuffle}>Shuffle</button>
        </div>
      </div>
      {pinned.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Pinned</div>
          {pinned.map((s) => (
            <div key={`p-${s.id}`} className="flex items-center justify-between rounded border p-2 text-sm">
              <span>{s.text}</span>
              <div className="flex items-center gap-2">
                {onUse && <button className="text-xs underline" onClick={() => onUse(s)}>Use</button>}
                <button className="text-xs underline" onClick={() => unpin(s.id)}>Unpin</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-1">
        {items.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded border p-2 text-sm">
            <span>{s.text}</span>
            <div className="flex items-center gap-2">
              {onUse && <button className="text-xs underline" onClick={() => onUse(s)}>Use</button>}
              <button className="text-xs underline" onClick={() => pin(s)}>Pin</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  ), [items, pinned, onUse]);

  return content;
}

export default LiveSuggestions;

