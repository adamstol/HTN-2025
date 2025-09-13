import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ConversationsPage() {
  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, started_at, ended_at, contact:contact_id(display_name)")
    .order("started_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recent Conversations</h1>
        <Link href="/record" className="rounded-full bg-blue-600 px-4 py-2 text-white">Record</Link>
      </div>
      <div className="space-y-2">
        {(conversations ?? []).length === 0 && (
          <div className="text-sm text-muted-foreground">No conversations yet.</div>
        )}
        {conversations?.map((c) => (
          <Link key={c.id} className="block rounded border p-3 hover:bg-accent" href={`/conversations/${c.id}`}>
            <div className="text-sm">{(c as any)?.contact?.display_name ?? "Conversation"} · {c.id}</div>
            <div className="text-xs text-muted-foreground">{c.started_at} → {c.ended_at ?? "ongoing"}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

