import { createClient } from "@/lib/supabase/client";
import { getUserIdByEmail } from "../supabase/client-queries";
import { processTranscriptAndUpdateGraph } from "../zep/transcript-processor";

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
  "http://localhost:5001";

export async function sendTranscriptClient(opts: {
  file?: File;
  conversationId?: string;
  userEmail?: string;
  userName?: string;
}): Promise<TranscriptResponse> {
  const { file, conversationId, userEmail, userName } = opts;

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
    console.log("transcript", transcript);
    console.log("facts", facts);
    console.log("summary", summary);

    // Save to Supabase conversations table if conversationId provided
    let savedConversationId = conversationId;
    if (conversationId) {
      try {
        const supabase = createClient();

        // Create transcript text for storage
        const transcriptText = transcript
          .map((turn: ConversationTurn) => `${turn.speaker}: ${turn.text}`)
          .join('\n');

        // Process transcript with Zep graph
        try {

          const userId = await getUserIdByEmail(userEmail as string);
          if (userId) {
            await processTranscriptAndUpdateGraph(
              { transcript, facts, summary },
              userId,
              userName
            );
            console.log("Successfully processed transcript and updated Zep graph");
          }
        } catch (error) {
          console.error("Failed to process transcript with Zep:", error);
        }



        // if (error) {
        //   console.error('Failed to save transcript to database:', error);
        // }
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
