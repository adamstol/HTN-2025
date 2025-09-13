import React from 'react';

interface ConversationHistoryProps {
  className?: string;
}

export default function ConversationHistory({ className = "" }: ConversationHistoryProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col justify-center items-center ${className}`}>
      <div className="text-center">
        <h1 className="text-2xl font-normal text-gray-200" style={{fontFamily: 'Simonetta, serif'}}>
          Conversation History
        </h1>
        <p className="text-gray-400 text-sm mt-4">
          Your conversation history will appear here
        </p>
      </div>
    </div>
  );
}
