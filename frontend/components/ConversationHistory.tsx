"use client";


import { ChevronUp, MoveUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface ConversationHistoryProps {
  className?: string;
  onScrollBack?: () => void;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
}

export default function ConversationHistory({
  className = "",
  onScrollBack,
}: ConversationHistoryProps) {
  const router = useRouter();
  // Mock conversation data
  const [conversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Conversation 1",
      timestamp: "Jan 2, 2025",
    },
    {
      id: "2",
      title: "Conversation 1",
      timestamp: "Jan 2, 2025",
    },
    {
      id: "3",
      title: "Conversation 1",
      timestamp: "Jan 2, 2025",
    },
  ]);

  const handleScrollBack = () => {
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Call optional callback
    if (onScrollBack) {
      onScrollBack();
    }
  };

  return (
    <div className={`text-white w-full ${className}`}>
        {conversations.length === 0 ? (
          <p className="text-gray-400 text-sm text-center">
            Your conversation history will appear here
          </p>
        ) : (
          <div className="w-full max-w-md mx-auto space-y-3">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => router.push(`/record/${conversation.id}`)}
                className="bg-[#353E41] rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-slate-600 transition-colors">
                <div className="flex flex-col">
                  <h3
                    className="text-white text-sm font-medium"
                    style={{ fontFamily: "Simonetta, serif" }}>
                    {conversation.title}
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">
                    {conversation.timestamp}
                  </p>
                </div>
                <MoveUpRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
