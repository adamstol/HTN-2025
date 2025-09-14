import { createClient } from "@/lib/supabase/client";

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const supabase = createClient();

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

  // const { data, error } = await supabase.rpc("get_user_id_by_email", {
  //   p_email: email,
  // });
  return "e75a53e5-e978-4f54-b723-33cb31a0402a"
  // if (error) return null;
  // return data ?? null; // data is uuid or null
}

export async function getPhoneNumberById(id: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('profiles').select('phone_number').eq('id', id).single();
  if (error) return null;
  return data?.phone_number ?? null;
}
