"use client";

import { ChevronUp, MoveUpRight } from 'lucide-react';
import React, { useState } from 'react';

interface NetworkProps {
  className?: string;
  onScrollBack?: () => void;
}

interface Connection {
  id: string;
  name: string;
  timeConnected: string;
  profilePicture: string;
}

export default function NetworkPage({ className = "", onScrollBack }: NetworkProps) {
  // Mock connection data
  const [connections] = useState<Connection[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      timeConnected: 'Connected 2 hours ago',
      profilePicture: 'AJ'
    },
    {
      id: '2',
      name: 'Sarah Chen',
      timeConnected: 'Connected yesterday',
      profilePicture: 'SC'
    },
    {
      id: '3',
      name: 'Michael Rodriguez',
      timeConnected: 'Connected 3 days ago',
      profilePicture: 'MR'
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
      <div className="flex-1 flex flex-col items-center px-6">
        <h1 className="text-2xl font-normal text-gray-200 mb-8 border-b border-gray-600 pb-4 w-full text-center" style={{ fontFamily: 'Simonetta, serif' }}>
          Your Network
        </h1>

        {connections.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Your network connections will appear here
          </p>
        ) : (
          <div className="w-full max-w-md space-y-3">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="bg-slate-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-slate-600 transition-colors"
              >
                <div className='flex items-center'>
                  <div className='w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-4 text-white text-sm font-medium'>
                    {connection.profilePicture}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-white text-sm font-medium" style={{ fontFamily: 'Simonetta, serif' }}>
                      {connection.name}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                      {connection.timeConnected}
                    </p>
                  </div>
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
