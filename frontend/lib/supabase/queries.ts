import { createClient } from "@/lib/supabase/server";
import { ClubMatch, SharedStore } from "../pocketflow/types";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { log } from "console";

export async function fetchCandidateEmails(firstName: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('search_emails_by_first', {
    prefix: firstName,
    limit_count: 5
  });
  console.log(data, error);
  if (error) throw error;
  return (data ?? []).map((r: { email: string }) => r.email);
}

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const supabase = await createClient();
  // mock emails for testing
  if (process.env.ZEP_GRAPH_ID?.includes("mock")) {
    if (email === "chris.thompson@ucalgary.ca") return process.env.REAL_MOCK_USER_ID!;
    if (email === "alice.smith@ucalgary.ca") return process.env.REAL_MOCK_USER_ID!;
    if (email === "bob.johnson@ucalgary.ca") return process.env.POP_USER_ID!;
    if (email === "jamie.lee@ucalgary.ca") return process.env.REAL_MOCK_USER_ID!;
    if (email === "alex.kim@ucalgary.ca") return process.env.REAL_MOCK_USER_ID!;
    if (email === "henry.davis@ucalgary.ca") return process.env.REAL_MOCK_USER_ID!;
    return process.env.REAL_MOCK_USER_ID!;
  }

  const { data, error } = await supabase.rpc("get_user_id_by_email", {
    p_email: email,
  });
  if (error) return null;
  return data ?? null; // data is uuid or null
}

export async function getPhoneNumberById(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select('phone_number').eq('id', id).single();
  if (error) return null;
  return data?.phone_number ?? null;
}

export async function getPhoneNumberByEmail(email: string): Promise<string | null> {
  // mock emails for testing
  if (process.env.ZEP_GRAPH_ID?.includes("mock")) {
    if (email === "chris.thompson@ucalgary.ca") return process.env.RAMI_PHONE_NUMBER!;
    if (email === "alice.smith@ucalgary.ca") return process.env.RAMI_PHONE_NUMBER!;
    if (email === "bob.johnson@ucalgary.ca") return process.env.RAMI_PHONE_NUMBER!;
    if (email === "jamie.lee@ucalgary.ca") return process.env.RAMI_PHONE_NUMBER!;
    if (email === "alex.kim@ucalgary.ca") return process.env.RAMI_PHONE_NUMBER!;
    if (email === "henry.davis@ucalgary.ca") return process.env.RAMI_PHONE_NUMBER!;
    return process.env.RAMI_PHONE_NUMBER!;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select('phone_number').eq('email', email).single();
  if (error) return null;
  return data?.phone_number ?? null;
}

export async function linkPhoneToProfile(email: string, phone: string): Promise<string> {
  const supabase = await createClient();
  const userId = await getUserIdByEmail(email);
  if (!userId) throw new Error("User not found");
  console.log("linking", userId, phone);
  const { data, error } = await supabase.from('profiles').update({ phone_number: phone }).eq('id', userId).select("id").single()
  if (error) throw error;
  return data.id;
}


export async function loadSharedStore(sessionId: string): Promise<{ shared: SharedStore, version: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flow_sessions")
    .select("state, version")
    .eq("session_id", sessionId)
    .single();
  if (error && error.code !== "PGRST116") throw error; // not found OK
  return {
    shared: (data?.state as SharedStore) ?? ({} as SharedStore),
    version: data?.version ?? 0,
  };
}

export async function saveSharedStore(sessionId: string, shared: SharedStore, prevVersion: number) {
  const supabase = await createClient();
  // optimistic lock: only update if version matches
  const { error } = await supabase.rpc("pf_update_session", {
    p_session_id: sessionId,
    p_state: shared,
    p_prev_version: prevVersion
  });
  if (error) throw error;
}


// ---- Warm intros -----------------------------------------------------------
export async function createWarmIntro(input: {
  from_first_name: string;
  from_last_name: string;
  from_email: string;
  to_first_name: string;
  to_last_name: string;
  to_email: string;
  intro_message: string;
  delivery_medium?: 'email' | 'whatsapp';
}): Promise<{ id: string } | null> {
  const supabase = await createClient();

  // Resolve profile ids by email
  const fromId = await getUserIdByEmail(input.from_email);
  const toId = await getUserIdByEmail(input.to_email);
  if (!fromId || !toId) {
    throw new Error(`Unable to find user with email $${input.to_email}`);
  }

  const payload = {
    from_profile_id: fromId,
    to_profile_id: toId,
    // from_first_name: input.from_first_name,
    // from_last_name: input.from_last_name,
    // from_email: input.from_email,
    // to_first_name: input.to_first_name,
    // to_last_name: input.to_last_name,
    // to_email: input.to_email,
    intro_message: input.intro_message,
    delivery_medium: input.delivery_medium ?? 'whatsapp',
  };

  const { data, error } = await supabase
    .from('warm_intros')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return data as { id: string };
}



// ---- 1) Vector search: embed the query, call Supabase RPC, return matches ----
/**
 * searchClubs
 * - Embeds the user query (text-embedding-3-small, 1536-d)
 * - Calls Supabase RPC (match_clubs) to retrieve top-k similar clubs
 * - Optional keyword prefilter via Postgres full-text (set keyword to narrow domain)
 */
export async function searchClubs(opts: {
  query: string;
  k?: number;                  // top-k, default 8
  minSimilarity?: number;      // 0..1 cosine-based similarity threshold
  keyword?: string | null;     // optional hybrid keyword filter
}): Promise<ClubMatch[]> {
  const supabase = await createClient();

  const { query, k = 8, minSimilarity = 0.3, keyword = null } = opts;

  // 1) Embed the query with Vercel AI SDK + OpenAI provider
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query,
  });

  // 2) Vector search via RPC
  const { data, error } = await supabase.rpc('match_clubs', {
    query_embedding: embedding,
    match_count: k,
    min_similarity: minSimilarity,
    keyword,
  });
  log("searchClubs", { query, k, minSimilarity, keyword, data, error });

  if (error) {
    throw new Error(`match_clubs RPC failed: ${error.message}`);
  }

  // Data already includes similarity; ensure typing
  return (data ?? []) as ClubMatch[];
}

export async function checkIfIntroExists(from_email: string, to_email: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('warm_intros')
    .select('id')
    .eq('from_email', from_email)
    .eq('to_email', to_email)
    .single();
  if (error) return false;
  return true;
}
