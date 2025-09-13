import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ContactPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const contactId = params.id;

  const { data: contact } = await supabase.from("contacts").select("*, conversations:conversations(id, started_at, ended_at)").eq("id", contactId).single();

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{contact?.display_name ?? "Contact"}</h1>
        <Link className="rounded bg-emerald-600 px-3 py-2 text-white" href="/record">Start Call</Link>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Shared Interests</h2>
        <div className="text-sm text-muted-foreground">Pulled from Zep graph (configure ZEP_API_KEY / ZEP_GRAPH_ID).</div>
        <div className="rounded border p-3 text-sm">Coming soon</div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Conversations</h2>
        <div className="space-y-2">
          {(contact?.conversations ?? []).length === 0 && (
            <div className="text-sm text-muted-foreground">No conversations yet.</div>
          )}
          {contact?.conversations?.map((c: any) => (
            <Link key={c.id} className="block rounded border p-3 hover:bg-accent" href={`/conversations/${c.id}`}>
              <div className="text-sm">Conversation {c.id}</div>
              <div className="text-xs text-muted-foreground">{c.started_at} → {c.ended_at ?? "ongoing"}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

