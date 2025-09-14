// app/c/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import JoinClient from './JoinClient';
import SessionStartingView from '@/app/record/[id]/components/SessionStartingView';
import { ConversationData } from '@/lib/types';

export default async function Join({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { code } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is not authenticated, show login UI
  if (!user) {
    return <JoinClient conversationId={id} inviteCode={code as string} />;
  }

  // User is authenticated, attempt to claim scanner
  try {
    await supabase.rpc('claim_scanner_by_email', { p_conversation: id, p_code: code, p_email: user.email });
    // Redirect to the conversation/recording page after successful claim
  } catch (error) {
    console.error('Failed to claim scanner:', error);
    return (
      <div className="h-screen flex flex-col items-center justify-center text-white bg-gradient-to-b from-[#343D40] to-[#131519]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-400">Failed to Join</h1>
          <p className="text-gray-300">Unable to join the conversation. The invite may be invalid or expired.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg text-white font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  const conversation: ConversationData = {
    id: id,
    // 1 min ago
    started_at: new Date(new Date().getTime() - 60 * 1000).toISOString(),
    ended_at: new Date().toISOString(),
    location: undefined,
    status: 'active',
    initiator_user_id: user.id,
    invite_code: code as string,
  };
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-b from-[#343D40] to-[#131519]">
      <div className="w-full max-w-lg px-4">
        <SessionStartingView conversationId={id} conversation={conversation} />
      </div>
    </div>
  )
}
