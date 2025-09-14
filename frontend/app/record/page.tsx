import RecordGate from "./RecordGate";
import { createConversation } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RecordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  const { id, url } = await createConversation();
  return <RecordGate initialId={id} inviteUrl={url} />;
}
