import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTranscript } from "@/lib/vapi";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json().catch(() => ({}));
  const { audioUrl, vapi_call_id, fullTranscript, conversation_id, contact_id } = body as {
    audioUrl?: string;
    vapi_call_id?: string;
    fullTranscript?: string;
    conversation_id?: string;
    contact_id?: string;
  };

  let transcript = fullTranscript ?? "";
  let stt_provider = "mock" as string;

  try {
    if (vapi_call_id && process.env.VAPI_API_KEY) {
      const call = await fetchTranscript(vapi_call_id);
      const t = (call as any)?.transcript?.text ?? (call as any)?.transcript ?? "";
      if (t) { transcript = String(t); stt_provider = "vapi"; }
    }
  } catch {
    // fall through to mock
  }

  if (!transcript) {
    if (process.env.USE_MOCK_STT === "true") {
      transcript = "We met at the conference and discussed embeddings and hiking.";
    } else if (audioUrl) {
      // Placeholder: integrate actual STT here (e.g., OpenAI Whisper) if desired
      transcript = "(transcription pending)";
    }
  }

  const transcript_hash = crypto.createHash("sha256").update(transcript).digest("hex");

  // Best-effort persist a conversation record if possible
  let savedId: string | null = null;
  try {
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        contact_id: contact_id ?? null,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        raw_transcript: transcript,
        stt_provider,
        transcript_hash,
      })
      .select("id").single();
    if (!error) savedId = data?.id ?? null;
  } catch {}

  return NextResponse.json({ transcript, stt_provider, transcript_hash, conversation_id: conversation_id ?? savedId });
}

