"use client";

import { useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConversationData } from "@/lib/types";

interface SessionStartingViewProps {
  conversationId: string;
  conversation: ConversationData;
}

export default function SessionStartingView({ conversationId, conversation }: SessionStartingViewProps) {
  const router = useRouter();
  
  // Auto-redirect after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/record/${conversationId}`);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [conversationId, router]);
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-10 w-full flex flex-col items-center">
        {/* Success checkmark with animation */}
        <div className="mb-6 relative">
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-green-500 animate-ping opacity-20"></div>
        </div>
        
        {/* Text content */}
        <h2 className="text-xl font-medium text-white mb-2 text-center">
          Your conversation will be recorded and analyzed
        </h2>
        <p className="text-gray-300 text-sm mb-6 text-center">
          Your session is starting
        </p>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Preparing recording environment...</span>
        </div>
      </div>
      
      {/* Session details */}
      <div className="mt-8 w-full">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-xs">Session ID</span>
            <span className="text-white text-xs font-mono">{conversationId.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-xs">Location</span>
            <span className="text-white text-xs">{conversation.location || "Not specified"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Started At</span>
            <span className="text-white text-xs">
              {new Date(conversation.started_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
