import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { callLlmJson } from "@/lib/llm";
import { ensureContactEntityAndSync } from "@/lib/zep/sync";

export const dynamic = "force-dynamic";

const ExtractionSchema = z.object({
  entities: z.array(z.object({ kind: z.string(), name: z.string(), canonical_key: z.string().optional().nullable(), meta: z.record(z.any()).optional().nullable(), salience: z.number().min(0).max(1).optional().default(0.5) })).default([]),
  relations: z.array(z.object({ src: z.string(), dst: z.string(), type: z.string(), weight: z.number().min(0).max(1).optional().default(0.5) })).default([]),
  memories: z.array(z.object({ title: z.string(), body: z.string(), tags: z.array(z.string()).default([]), due_at: z.string().optional().nullable() })).default([]),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { transcript, owner_id, contact_id, conversation_id, contact_name, contact_key } = await req.json();
  if (!transcript) return NextResponse.json({ error: "missing transcript" }, { status: 400 });

  let parsed = { entities: [], relations: [], memories: [] } as z.infer<typeof ExtractionSchema>;
  const canCallLlm = !!process.env.OPENAI_API_KEY;
  if (canCallLlm) {
    const prompt = `Extract entities (people, orgs, topics), relations, and actionable memories from the following transcript. Return compact JSON. Transcript:\n\n${transcript}`;
    try { parsed = await callLlmJson(prompt, ExtractionSchema); } catch { /* fallback below */ }
  }
  if (parsed.entities.length === 0) {
    // naive fallback
    const topics = Array.from(new Set((transcript as string).toLowerCase().match(/[a-z]{4,}/g) ?? [])).slice(0, 3);
    parsed.entities = topics.map((t) => ({ kind: "topic", name: t, canonical_key: t, salience: 0.4 }));
  }

  // Upsert to Supabase (best-effort)
  try {
    const eInsert = parsed.entities.map((e) => ({
      owner_id: owner_id ?? null,
      conversation_id: conversation_id ?? null,
      kind: e.kind, name: e.name, canonical_key: e.canonical_key ?? null, meta: e.meta ?? {}, salience: e.salience ?? 0.5,
    }));
    if (eInsert.length) await supabase.from("entities").insert(eInsert);

    // relations assume matching by name in same conversation for demo
    if ((parsed.relations ?? []).length) {
      const { data: ents } = await supabase.from("entities").select("id, name").eq("conversation_id", conversation_id);
      const idByName = new Map((ents ?? []).map((e) => [e.name, e.id]));
      const rInsert = parsed.relations.map((r) => ({ owner_id: owner_id ?? null, conversation_id, src_entity_id: idByName.get(r.src), dst_entity_id: idByName.get(r.dst), type: r.type, weight: r.weight ?? 0.5 }))
        .filter((r) => r.src_entity_id && r.dst_entity_id) as any[];
      if (rInsert.length) await supabase.from("relations").insert(rInsert);
    }

    if ((parsed.memories ?? []).length) {
      const mInsert = parsed.memories.map((m) => ({ owner_id: owner_id ?? null, contact_id: contact_id ?? null, title: m.title, body: m.body, tags: m.tags ?? [], due_at: m.due_at ?? null, source_conversation_id: conversation_id ?? null }));
      await supabase.from("memories").insert(mInsert);
    }
  } catch {
    // ignore in demo mode
  }

  // Sync to Zep graph (best-effort)
  try {
    await ensureContactEntityAndSync({ contactName: contact_name ?? null, contactKey: contact_key ?? null, transcript });
  } catch { }

  return NextResponse.json({ ok: true, ...parsed });
}
