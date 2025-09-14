import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ConversationTurn = { speaker: string; text: string };

export async function POST(req: Request) {
  const supabase = await createClient();

  const body = await req.json().catch(() => ({}));
  const {
    transcript,
    conversation,
    contact_id,
  }: {
    transcript?: string;
    conversation?: ConversationTurn[];
    contact_id?: string;
  } = body ?? {};

  // Normalize text to store/hash and to send to analyzer
  let textForStorage = "";
  if (typeof transcript === "string" && transcript.trim()) {
    textForStorage = transcript.trim();
  } else if (Array.isArray(conversation) && conversation.length > 0) {
    textForStorage = conversation
      .map((t) => `${t.speaker}: ${t.text}`)
      .join("\n");
  }

  const transcript_hash = crypto
    .createHash("sha256")
    .update(textForStorage)
    .digest("hex");

  // Call Python backend analyzer (best-effort)
  const backendBase = process.env.BACKEND_URL || "http://localhost:5001";
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
      // Ensure server-side fetch, no caching
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      analysis = json?.analysis ?? json ?? null;
    }
  } catch {
    // ignore analyzer failures; continue to persist transcript
  }

  // Persist conversation snapshot (best-effort)
  let savedId: string | null = null;
  try {
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
    if (!error) savedId = (data as any)?.id ?? null;
  } catch {
    // swallow insert errors; still return analysis
  }

  return NextResponse.json({
    ok: true,
    conversation_id: savedId,
    transcript_hash,
    analysis,
  });
}
