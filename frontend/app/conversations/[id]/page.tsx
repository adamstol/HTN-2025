import { createClient } from "@/lib/supabase/server";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  const { data: convo } = await supabase
    .from("conversations")
    .select("id, started_at, ended_at, raw_transcript, stt_provider")
    .eq("id", id)
    .single();

  const { data: entities } = await supabase
    .from("entities")
    .select("id, kind, name, salience")
    .eq("conversation_id", id)
    .order("salience", { ascending: false });

  const { data: relations } = await supabase
    .from("relations")
    .select("id, src_entity_id, dst_entity_id, type, weight")
    .eq("conversation_id", id);

  const { data: memories } = await supabase
    .from("memories")
    .select("id, title, body, tags, due_at")
    .eq("source_conversation_id", id);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Conversation {convo?.id}</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Transcript</h2>
        <div className="rounded border p-3 text-sm whitespace-pre-wrap min-h-24">{convo?.raw_transcript ?? "(no transcript)"}</div>
        <div className="text-xs text-muted-foreground">Provider: {convo?.stt_provider ?? "n/a"}</div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Entities</h2>
          <div className="space-y-1">
            {(entities ?? []).map((e) => (
              <div key={e.id} className="rounded border p-2 text-sm">
                <div className="font-medium">{e.name}</div>
                <div className="text-xs text-muted-foreground">{e.kind} · salience {e.salience}</div>
              </div>
            ))}
            {(entities ?? []).length === 0 && <div className="text-sm text-muted-foreground">No entities.</div>}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Memories</h2>
          <div className="space-y-1">
            {(memories ?? []).map((m) => (
              <div key={m.id} className="rounded border p-2 text-sm">
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground">{(m.tags as string[] | null)?.join(", ")}</div>
                <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                {m.due_at && <div className="text-xs text-muted-foreground">Due {m.due_at}</div>}
              </div>
            ))}
            {(memories ?? []).length === 0 && <div className="text-sm text-muted-foreground">No memories.</div>}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Relations</h2>
        <div className="space-y-1">
          {(relations ?? []).map((r) => (
            <div key={r.id} className="rounded border p-2 text-sm">{r.type}: {r.src_entity_id} → {r.dst_entity_id} (w={r.weight})</div>
          ))}
          {(relations ?? []).length === 0 && <div className="text-sm text-muted-foreground">No relations.</div>}
        </div>
      </section>
    </div>
  );
}
