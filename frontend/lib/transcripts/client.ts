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

const backendBase =
  process.env.NEXT_PUBLIC_PY_BACKEND_URL ||
  process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL ||
  "http://localhost:5000";

export async function sendTranscriptClient(opts: {
  file?: File;
  transcript?: string;
  conversation?: ConversationTurn[];
  contact_id?: string;
}) {
  const { file, transcript, conversation, contact_id } = opts;

  // Normalize to text to hash/store
  const textForStorage = (() => {
    if (file) return file.name; // just name for hash
    if (typeof transcript === "string" && transcript.trim()) return transcript.trim();
    if (Array.isArray(conversation) && conversation.length > 0) {
      return conversation.map((t) => `${t.speaker}: ${t.text}`).join("\n");
    }
    return "";
  })();

  const transcript_hash = await sha256Hex(textForStorage);

  let analysis: unknown = null;
  let backendResponse: any = null;

  // Persist conversation to Supabase first to get conversation_id
  const supabase = createClient();
  let conversation_id: string | null = null;
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      contact_id: contact_id ?? null,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      raw_transcript: textForStorage,
      stt_provider: file ? "python-transcribe" : "python-analyze",
      transcript_hash,
    } as any)
    .select("id")
    .single();

  if (!error) conversation_id = (data as any)?.id ?? null;

  try {
    if (file) {
      // Send audio/video file to Flask /transcribe
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${backendBase}/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to transcribe file");
      backendResponse = await res.json();
      analysis = backendResponse.analysis ?? null;
      
      // Update textForStorage with the actual conversation from backend
      if (backendResponse.conversation && Array.isArray(backendResponse.conversation)) {
        const conversationText = backendResponse.conversation
          .map((turn: ConversationTurn) => `${turn.speaker}: ${turn.text}`)
          .join("\n");
        // Re-calculate hash with actual transcribed content
        const actualHash = await sha256Hex(conversationText);
        
        // Update the Supabase record with actual transcribed content
        if (conversation_id) {
          await supabase
            .from("conversations")
            .update({
              raw_transcript: conversationText,
              transcript_hash: actualHash,
            })
            .eq("id", conversation_id);
        }
        
        return {
          ok: true,
          conversation_id,
          transcript_hash: actualHash,
          analysis,
          backendResponse,
          conversation: backendResponse.conversation,
        } as const;
      }
    } else {
      // For text/conversation input, we don't have a separate /analyze endpoint
      // The backend only supports file transcription currently
      console.warn("Backend only supports file transcription. Text analysis not available.");
      analysis = null;
    }
  } catch (error) {
    console.error("Backend request failed:", error);
    // proceed without analysis if network/CORS fails
  }

  return {
    ok: true,
    conversation_id,
    transcript_hash,
    analysis,
    backendResponse,
  } as const;
}
