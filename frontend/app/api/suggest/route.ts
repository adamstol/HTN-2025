import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function simpleSuggest(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  const nouns = Array.from(new Set(t.split(/[\s,.!?]+/).filter((w) => /[A-Za-z]{4,}/.test(w)))).slice(0, 5);
  const starters = [
    "Ask about their experience with",
    "Explore shared interest in",
    "Dive deeper into",
    "Relate it to",
    "Follow up on",
  ];
  const suggestions: string[] = [];
  for (let i = 0; i < Math.min(5, nouns.length); i++) {
    const s = starters[i % starters.length];
    suggestions.push(`${s} ${nouns[i]}`);
  }
  if (suggestions.length === 0) suggestions.push("Ask about highlights and next steps");
  return suggestions;
}

export async function POST(req: Request) {
  const { transcriptWindow } = await req.json().catch(() => ({ transcriptWindow: "" }));
  if (!transcriptWindow) return NextResponse.json({ suggestions: [] });

  const useMock = (process.env.USE_MOCK_SUGGESTIONS === "true") || (process.env.NEXT_PUBLIC_USE_MOCK_SUGGESTIONS === "true");
  if (useMock || !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ suggestions: simpleSuggest(transcriptWindow) });
  }

  // If an LLM is configured, this can be upgraded to call it.
  // For now, keep it deterministic without external calls.
  return NextResponse.json({ suggestions: simpleSuggest(transcriptWindow) });
}

