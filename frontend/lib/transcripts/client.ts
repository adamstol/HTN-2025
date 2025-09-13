import { createClient } from "@/lib/supabase/client";

export type ConversationTurn = { speaker: string; text: string };

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sendTranscriptClient(opts: {
  transcript?: string;
  conversation?: ConversationTurn[];
  contact_id?: string;
}) {
  const { transcript, conversation, contact_id } = opts;

  // Normalize to text to hash/store
  const textForStorage = ((): string => {
    if (typeof transcript === "string" && transcript.trim()) return transcript.trim();
    if (Array.isArray(conversation) && conversation.length > 0) {
      return conversation.map((t) => `${t.speaker}: ${t.text}`).join("\n");
    }
    return "";
  })();

  const transcript_hash = await sha256Hex(textForStorage);

  // Call Flask analyzer directly from the browser (requires CORS on backend)
  const backendBase =
    process.env.NEXT_PUBLIC_PY_BACKEND_URL || process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://localhost:5000";

  let analysis: unknown = null;
  try {
    const res = await fetch(`${backendBase}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        Array.isArray(conversation) && conversation.length > 0
          ? { conversation }
          : { text: textForStorage }
      ),
      mode: "cors",
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      analysis = json?.analysis ?? json ?? null;
    }
  } catch (_) {
    // If CORS or network fails, proceed without analysis
  }

  // Persist to Supabase from the client (RLS must allow insert)
  const supabase = createClient();
  let conversation_id: string | null = null;
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      contact_id: contact_id ?? null,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      raw_transcript: textForStorage,
      stt_provider: "python-analyze",
      transcript_hash,
    } as any)
    .select("id")
    .single();

  if (!error) conversation_id = (data as any)?.id ?? null;

  return { ok: true, conversation_id, transcript_hash, analysis } as const;
}
