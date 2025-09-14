import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RecordingInterface from './RecordingInterface';

export default async function ConversationRecordPage({ 
  params 
}: { 
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/c/${id}`);
  }

  // Verify user is part of this conversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('id, initiator_user_id, scanner_user_id, status')
    .eq('id', id)
    .single();

  if (error || !conversation) {
    redirect('/');
  }

  // Check if user is either initiator or scanner
  const isParticipant = conversation.initiator_user_id === user.id || 
                       conversation.scanner_user_id === user.id;

  if (!isParticipant) {
    redirect('/');
  }

  return (
    <RecordingInterface 
      conversationId={id}
      userId={user.id}
      isInitiator={conversation.initiator_user_id === user.id}
      conversationStatus={conversation.status}
    />
  );
}
