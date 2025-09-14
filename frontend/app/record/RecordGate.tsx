"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import QRCode from "qrcode";
import RecordClient from "./RecordClient";

type Props = {
  initialId: string;
  inviteUrl: string;
};

export default function RecordGate({ initialId, inviteUrl }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<"pending" | "active" | "ended">("pending");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    // Render QR for invite URL
    QRCode.toDataURL(inviteUrl)
      .then((url) => mounted && setQrDataUrl(url))
      .catch(() => {});

    // Subscribe to conversation status updates
    const ch = supabase
      .channel(`conv:${initialId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${initialId}` },
        (payload) => {
          const row: any = payload.new;
          if (row?.status === "active") setStatus("active");
          if (row?.status === "ended") setStatus("ended");
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [initialId, inviteUrl, supabase]);

  if (status === "active") {
    return <RecordClient />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm text-center border border-slate-700">
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

