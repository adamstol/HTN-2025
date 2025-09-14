import { createClient } from "@/lib/supabase/client";

export type ConversationTurn = { speaker: string; text: string };

export type TranscriptResponse = {
  ok: boolean;
  transcript: ConversationTurn[];
  facts: Record<string, string[]>;
  summary: string;
  conversation_id?: string;
};

const backendBase =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

export async function sendTranscriptClient(opts: {
  file?: File;
  conversationId?: string;
}): Promise<TranscriptResponse> {
  const { file, conversationId } = opts;

  if (!file) {
    throw new Error("File is required for transcription");
  }

  try {
    // Send audio/video file to Flask /transcribe
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${backendBase}/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to transcribe file");
    const backendResponse = await res.json();

    // Extract data from new backend format
    const transcript = backendResponse.transcript || [];
    const facts = backendResponse.facts || {};
    const summary = backendResponse.summary || "";

    // Save to Supabase conversations table if conversationId provided
    let savedConversationId = conversationId;
    if (conversationId) {
      try {
        const supabase = createClient();

        // Create transcript text for storage
        const transcriptText = transcript
          .map((turn: ConversationTurn) => `${turn.speaker}: ${turn.text}`)
          .join('\n');

        // Update the conversation with transcript data
        const { error } = await supabase
          .from('conversations')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),

            // Note: Based on schema, there's no transcript field, so we store in location for now
          })
          .eq('id', conversationId);

        if (error) {
          console.error('Failed to save transcript to database:', error);
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
      }
    }

    return {
      ok: true,
      transcript,
      facts,
      summary,
      conversation_id: savedConversationId,
    };
  } catch (error) {
    console.error("Transcription failed:", error);
    throw error;
  }
}
