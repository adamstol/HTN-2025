import { ChevronUp, MoveUpRight } from 'lucide-react';
import React, { useState } from 'react';

interface ConversationHistoryProps {
  className?: string;
  onScrollBack?: () => void;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
}

export default function ConversationHistory({ className = "", onScrollBack }: ConversationHistoryProps) {
  // Mock conversation data
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Conversation 1',
      timestamp: 'Jan 2, 2025'
    },
    {
      id: '2', 
      title: 'Conversation 1',
      timestamp: 'Jan 2, 2025'
    },
    {
      id: '3',
      title: 'Conversation 1', 
      timestamp: 'Jan 2, 2025'
    }
  ]);

  const handleScrollBack = () => {
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Call optional callback
    if (onScrollBack) {
      onScrollBack();
    }
  };

  return (
    <div className={`h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col ${className}`}>
      <button 
        onClick={handleScrollBack}
        className="bg-white w-[30px] h-[30px] mt-5 ml-5 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <ChevronUp className="w-5 h-5 text-black" />
      </button>
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-2xl font-normal text-gray-200 mb-8" style={{fontFamily: 'Simonetta, serif'}}>
          Conversation History
        </h1>
        
        {conversations.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Your conversation history will appear here
          </p>
        ) : (
          <div className="w-full max-w-md space-y-3">
            {conversations.map((conversation) => (
              <div 
                key={conversation.id}
                className="bg-slate-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-slate-600 transition-colors"
              >
                <div className="flex flex-col">
                  <h3 className="text-white text-sm font-medium" style={{fontFamily: 'Simonetta, serif'}}>
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
    </div>
  );
}
