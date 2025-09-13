import { client } from "./client";

export async function ensureContactEntityAndSync(opts: {
  contactName?: string | null;
  contactKey?: string | null; // canonical key or email
  transcript?: string | null;
}) {
  const graphId = process.env.ZEP_GRAPH_ID;
  if (!graphId) return;
  const { contactName, contactKey, transcript } = opts;

  try {
    await client.graph.get(graphId);
  } catch {
    await client.graph.create({ graphId });
  }

  // create contact node if missing (best-effort)
  if (contactKey) {
    try {
      const search = await client.graph.search({ graphId, query: String(contactKey), scope: "nodes", limit: 1 });
      const exists = (search.nodes?.length ?? 0) > 0;
      if (!exists) {
        await client.graph.add({ graphId, type: "json", data: JSON.stringify({ action: "Create_entity", entity_type: "Contact", contact_key: contactKey, contact_name: contactName ?? contactKey }) });
      }
    } catch {}
  }

  if (transcript) {
    await client.graph.add({ graphId, type: "text", data: transcript.slice(0, 4000) });
  }
}

