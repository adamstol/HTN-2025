"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import LiveSuggestions from "@/components/LiveSuggestions";
import { useRollingTranscript } from "@/hooks/useRollingTranscript";

function useRecorder() {
  const mediaRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioUrl(URL.createObjectURL(blob));
    };
    rec.start();
    mediaRef.current = rec;
    setIsRecording(true);
  };
  const stop = () => { mediaRef.current?.stop(); setIsRecording(false); };
  const reset = () => { setAudioUrl(null); chunksRef.current = []; };
  return { start, stop, reset, isRecording, audioUrl };
}

export default function RecordPage() {
  const { addText, windowText, clear } = useRollingTranscript();
  const { start, stop, reset, isRecording, audioUrl } = useRecorder();
  const [fullTranscript, setFullTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // fake interim transcript typing for demo if USE_MOCK_STT is true
  useEffect(() => {
    if (!isRecording) return;
    if (process.env.USE_MOCK_STT === "true" || process.env.NEXT_PUBLIC_USE_MOCK_STT === "true") {
      const samples = [
        "We met at the hackathon and talked about graph databases.",
        "They love climbing and machine learning, especially embeddings.",
        "We planned to sync next week about a new project.",
      ];
      let i = 0;
      const id = setInterval(() => { const t = samples[i % samples.length]; addText(t); setFullTranscript((p) => p + (p ? " " : "") + t); i++; }, 2500);
      return () => clearInterval(id);
    }
  }, [isRecording, addText]);

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/stt/finish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audioUrl, fullTranscript }) });
      const data = await res.json();
      if (data?.transcript) {
        setFullTranscript(data.transcript);
      }
    } finally { setIsSubmitting(false); }
  };

  const onUseSuggestion = async (s: { id: string; text: string }) => {
    addText(s.text);
  };

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Record Conversation</h1>

      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button className="rounded bg-green-600 px-3 py-2 text-white" onClick={start}>Start</button>
        ) : (
          <button className="rounded bg-red-600 px-3 py-2 text-white" onClick={stop}>Stop</button>
        )}
        <button className="rounded border px-3 py-2" onClick={() => { reset(); clear(); setFullTranscript(""); }}>Reset</button>
        <button className="rounded border px-3 py-2" disabled={isSubmitting} onClick={handleFinish}>{isSubmitting ? "Processing…" : "Finish & Transcribe"}</button>
      </div>

      {audioUrl && (
        <audio controls src={audioUrl} className="w-full" />
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-medium">Transcript (rolling window)</div>
          <div className="min-h-24 rounded border p-3 text-sm whitespace-pre-wrap">{windowText || "(waiting for audio or input)"}</div>
          <div className="text-xs text-muted-foreground">Only last N seconds are used for suggestions.</div>
        </div>
        <LiveSuggestions transcriptWindow={windowText} onUse={onUseSuggestion} />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Full Transcript</div>
        <textarea value={fullTranscript} onChange={(e) => setFullTranscript(e.target.value)} className="w-full min-h-40 rounded border p-3 text-sm" placeholder="Transcribed content will appear here" />
      </div>
    </div>
  );
}

