"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, MessageCircle, Phone, Video, Mail, MoreHorizontal } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Interfaces aligned with database schema
interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  gender: string | null;
}

interface Conversation {
  id: string;
  initiator_user_id: string;
  scanner_user_id: string;
  scanner_email: string;
  status: 'pending' | 'active' | 'ended';
  started_at: string;
  ended_at: string;
  location: string | null;
  invite_code: string;
}

// ConnectionDetails combines user data with their conversations
interface ConnectionDetails extends User {
  conversations: Conversation[];
  connections: Array<{
    id: string;
    name: string;
    email: string;
    profile_picture?: string;
  }>;
  // UI-only fields (not in actual DB)
  profile: {
    first_met_where: string | null;
    occupation_title: string | null;
    occupation_company: string | null;
    occupation_start_date: string | null;
    life_goals: string[] | null;
    last_interaction_at: string | null;
  };
}

// Helper function to format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  
  // For older dates, return the actual date
  return date.toLocaleDateString();
};

// Using ConnectionDetails interface from mock-supabase.ts

export default function NetworkConnectionPage() {
  const router = useRouter();
  const params = useParams();
  const connectionId = params.id as string;
  
  const [connection, setConnection] = useState<ConnectionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch connection details from our API route
  const fetchConnectionDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call our API route
      const response = await fetch(`/api/network/${connectionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load connection details');
      }
      
      const data = await response.json();
      
      // Add profile pictures for UI (in a real app, these would come from the database)
      const connectionWithPictures = {
        ...data,
        connections: data.connections.map((conn: any) => ({
          ...conn,
          profile_picture: conn.name.split(' ')[0] // Use first name as avatar seed
        }))
      };
      
      setConnection(connectionWithPictures);
      
    } catch (err) {
      setError('Failed to load connection details');
      console.error('Error fetching connection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (connectionId) {
      fetchConnectionDetails();
    }
  }, [connectionId]);

  const handleBack = () => {
    router.push('/network');
  };

  const handleMessage = () => {
    // TODO: Implement messaging functionality
    console.log('Opening message with:', connection?.name);
  };

  const handleCall = () => {
    // TODO: Implement call functionality
    console.log('Calling:', connection?.name);
  };

  const handleVideoCall = () => {
    // TODO: Implement video call functionality
    console.log('Video calling:', connection?.name);
  };

  const handleEmail = () => {
    if (connection?.email) {
      window.open(`mailto:${connection.email}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-gray-400">Loading connection details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !connection) {
    return (
      <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col">
        <div className="p-6">
          <button
            onClick={handleBack}
            className="bg-white px-3 py-[7px] rounded-full flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-black" />
            <span className="text-black text-sm font-normal">Back</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Connection not found'}</p>
            <button 
              onClick={fetchConnectionDetails}
              className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6">
        <button
          onClick={handleBack}
          className="bg-white px-3 py-[7px] rounded-full flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
          style={{ fontFamily: 'Simonetta, serif' }}
        >
          <ChevronLeft className="w-4 h-4 text-black" />
          <span className="text-black text-sm font-normal">Back</span>
        </button>
      </div>

      {/* Profile Section */}
      <div className="flex-1 flex flex-col items-center px-6">
        {/* Profile Picture */}
        <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
          <img
            src={`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${connection.name}`}
            alt={connection.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Name */}
        <h1 className="text-2xl font-normal text-white mb-3" style={{ fontFamily: 'Simonetta, serif' }}>
          {connection.name}
        </h1>
        
        {/* Gender and DOB */}
        <div className="flex items-center gap-4 text-gray-300 text-sm mb-2">
          <span>{connection.gender || 'Not specified'}</span>
        </div>
        
        {/* Last interaction */}
        {connection.profile.last_interaction_at && (
          <div className="text-blue-400 text-xs mb-4">
            Last interaction {formatRelativeTime(new Date(connection.profile.last_interaction_at))}
          </div>
        )}


        {/* Profile Details */}
        <div className="w-full max-w-md space-y-4">
          {/* How We Met */}
          <div className="bg-slate-700 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-gray-300 text-xs font-medium">We met at:</span>
              <p className="text-gray-300 text-xs leading-relaxed flex-1">{connection.profile.first_met_where || 'Information not available'}</p>
            </div>
          </div>

          {/* Life Goals */}
          <div className="bg-slate-700 rounded-2xl p-4">
            <h3 className="text-white text-sm font-medium mb-3" style={{ fontFamily: 'Simonetta, serif' }}>
              Life Goals
            </h3>
            <div className="space-y-2">
              {(connection.profile.life_goals || []).map((goal, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-xs leading-relaxed">{goal}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Their Connections */}
          <div className="bg-slate-700 rounded-2xl p-4">
            <h3 className="text-white text-sm font-medium mb-3" style={{ fontFamily: 'Simonetta, serif' }}>
              Their Connections
            </h3>
            <div className="flex gap-3">
              {connection.connections.map((conn) => (
                <div key={conn.id} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden mb-1">
                    <img
                      src={`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${conn.profile_picture || conn.name}`}
                      alt={conn.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-gray-300 text-xs text-center leading-tight">
                    {conn.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Occupation */}
          <div className="bg-slate-700 rounded-2xl p-4">
            <h3 className="text-white text-sm font-medium mb-3" style={{ fontFamily: 'Simonetta, serif' }}>
              Current Occupation
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-xs">Position</span>
                <span className="text-white text-sm font-medium">{connection.profile.occupation_title || 'Not specified'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-xs">Company</span>
                <span className="text-white text-sm font-medium">{connection.profile.occupation_company || 'Not specified'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-xs">Since</span>
                <span className="text-white text-sm font-medium">{connection.profile.occupation_start_date ? new Date(connection.profile.occupation_start_date).toLocaleDateString() : 'Not specified'}</span>
              </div>
            </div>
          </div>
          
          {/* Conversations History */}
          <div className="bg-slate-700 rounded-2xl p-4">
            <h3 className="text-white text-sm font-medium mb-3" style={{ fontFamily: 'Simonetta, serif' }}>
              Conversation History
            </h3>
            <div className="space-y-3">
              {connection.conversations && connection.conversations.length > 0 ? (
                connection.conversations.map((convo) => (
                  <div key={convo.id} className="border border-slate-600 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white text-xs font-medium">{new Date(convo.started_at).toLocaleDateString()}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        convo.status === 'active' ? 'bg-green-900 text-green-300' : 
                        convo.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {convo.status}
                      </span>
                    </div>
                    <div className="text-gray-300 text-xs mb-2">
                      Location: {convo.location || 'Not specified'}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">
                        {convo.initiator_user_id === connection.id ? 'They initiated' : 'You initiated'}
                      </span>
                      <span className="text-blue-400 cursor-pointer">View details</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-xs text-center py-2">
                  No conversation history found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
