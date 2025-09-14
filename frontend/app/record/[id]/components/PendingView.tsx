"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import QRCode from "qrcode";
import { ConversationData } from "@/lib/types";

interface PendingViewProps {
  conversationId: string;
  conversation: ConversationData;
}

export default function PendingView({ conversationId, conversation }: PendingViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<"pending" | "active" | "ended">("pending");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/c/${conversationId}?code=${conversation.invite_code}`;

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout;

    // Get the conversation details to build invite URL
    const getConversationDetails = async () => {
      // Generate QR code for invite URL
      QRCode.toDataURL(inviteUrl)
        .then((qrUrl) => mounted && setQrDataUrl(qrUrl))
        .catch((err) => console.error("Error generating QR code:", err));
    };

    getConversationDetails();

    console.log("Conversation status:", status);
    console.log("Conversation invite URL:", inviteUrl);
    console.log("Conversation initial ID:", conversationId);

    // Function to check conversation status
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('status')
          .eq('id', conversationId)
          .single();

        if (!error && data && mounted) {
          console.log("Polled conversation status:", data.status);
          setStatus(data.status);
        }
      } catch (err) {
        console.error("Error polling conversation status:", err);
      }
    };

    // Initial status check
    checkStatus();

    // Try real-time subscription first
    const ch = supabase
      .channel(`conv:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`
        },
        (payload) => {
          console.log("Real-time conversation status updated:", payload.new);
          const row: any = payload.new;
          if (mounted && row?.status) {
            setStatus(row.status);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to conversation updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel subscription error:', err);
          // Fallback to polling if real-time fails
          pollInterval = setInterval(checkStatus, 2000);
        }
      });

    // Fallback polling after 5 seconds if no real-time updates
    const fallbackTimeout = setTimeout(() => {
      if (mounted && status === 'pending') {
        console.log('Starting fallback polling for conversation status');
        pollInterval = setInterval(checkStatus, 2000);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      if (pollInterval) clearInterval(pollInterval);
      supabase.removeChannel(ch);
    };
  }, [conversationId, supabase, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#343D40] to-[#131519] text-white p-6">
      <div className="bg-[#353E41] rounded-xl p-6 w-full max-w-sm text-center border border-slate-700">
        <h2 className="text-lg font-semibold mb-2">Waiting for partner</h2>
        <p className="text-sm text-slate-300 mb-4">Scan this QR code to join the session.</p>
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Invite QR" className="mx-auto rounded bg-white p-2" />
        ) : (
          <div className="h-48 w-48 bg-slate-700 animate-pulse mx-auto rounded" />
        )}
        <p className="text-xs text-slate-400 mt-4 break-words">{inviteUrl}</p>
      </div>
    </div>
  );
}
