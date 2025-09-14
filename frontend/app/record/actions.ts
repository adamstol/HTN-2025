'use server';

import { randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function createConversation() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('auth');

  // 1) Reuse any existing pending conversation without a scanner
  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('id, invite_code')
    .eq('initiator_user_id', user.id)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    // Non-fatal; fall through to create
  }


  if (existing?.id && existing?.invite_code) {
    const url = `${process.env.APP_URL}/c/${existing.id}?code=${existing.invite_code}`;
    return { id: existing.id as string, url };
  }

  // 2) Otherwise create a fresh pending conversation
  const code = randomBytes(8).toString('base64url');
  const { data, error } = await supabase
    .from('conversations')
    .insert({ initiator_user_id: user.id, status: 'pending', invite_code: code, location: 'Engineering 7 | University of Waterloo', started_at: new Date().toISOString() } as any)
    .select('id, invite_code')
    .single();
  if (error) throw error;

  const url = `${process.env.APP_URL}/c/${data.id}?code=${data.invite_code}`;
  return { id: data.id as string, url };
}
