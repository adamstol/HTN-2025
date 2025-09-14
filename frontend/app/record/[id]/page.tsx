"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { MoveUpLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PendingView from "./components/PendingView";
import CurrentView from "./components/CurrentView";
import CompletedView from "./components/CompletedView";
import SessionStartingView from "./components/SessionStartingView";
import { ConversationData } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };
type ConversationStatus = 'pending' | 'active' | 'ended';


export default function ConversationPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchConversation = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setConversation(data);
      } catch (err) {
        console.error('Failed to fetch conversation:', err);
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();

    // Subscribe to real-time updates
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${id}` },
        (payload) => {
          setConversation(payload.new as ConversationData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Conversation not found'}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Always show the SessionStartingView for this page
  return (
    <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center px-6">
        <SessionStartingView conversationId={id} conversation={conversation} />
      </div>
    </div>
  );
}
