"use client";

import { ChevronLeft, MoveUpRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Connection interface aligned with database schema
interface Connection {
  id: string;
  name: string;
  email: string;
  created_at: string;
  gender: string | null;
  profile_picture?: string; // Not in DB, just for UI
  last_interaction_at?: string; // Derived from conversations
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

interface NetworkProps {
    className?: string;
    onScrollBack?: () => void;
}

// Using Connection interface from mock-supabase.ts

const avatarNames = [
    "Brian",
    "Emery",
    "Wyatt",
    "Caleb",
    "Liliana",
    "Jade",
    "Alexander",
    "Adrian",
    "Aiden",
    "Chase",
    "Christian",
    "Sadie",
    "Oliver",
    "Destiny",
    "Sawyer",
    "Jameson",
    "Sophia",
    "Jocelyn",
    "Andrea",
    "Eden",
] as const;

export function NetworkPage({ className = "", onScrollBack }: NetworkProps) {
    const router = useRouter();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // We'll use the mockSupabaseApi instead of generating connections directly

    // Fetch connections from our API route (which uses Supabase Edge Function)
    const fetchConnections = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Call our API route
            const response = await fetch('/api/network');
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load network connections');
            }
            
            const data = await response.json();
            
            // Add profile pictures for UI (in a real app, these would come from the database)
            const connectionsWithPictures = data.map((connection: any) => ({
                ...connection,
                profile_picture: connection.name.split(' ')[0] // Use first name as avatar seed
            }));
            
            setConnections(connectionsWithPictures);
            
        } catch (err) {
            setError('Failed to load network connections');
            console.error('Error fetching connections:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, []);

    const handleScrollBack = () => {
        // Navigate back to home/record page
        router.push('/record');
        // Call optional callback
        if (onScrollBack) {
            onScrollBack();
        }
    };

    const handleConnectionClick = (connectionId: string) => {
        router.push(`/network/${connectionId}`);
    };

    return (
        <div className={`h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col ${className}`}>
            <div className="">
                <button
                    onClick={handleScrollBack}
                    className="bg-white mt-5 mb-4 ml-5 px-3 py-[7px] rounded-full flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
                    style={{ fontFamily: 'Simonetta, serif' }}
                >
                    <ChevronLeft className="w-4 h-4 text-black" />
                    <span className="text-black text-sm font-normal">Back Home</span>
                </button>
            </div>
            <div className="flex-1 flex flex-col items-center px-6">
                <h1 className="text-2xl font-normal text-gray-200 mb-8 border-b border-gray-600 pb-4 w-full text-center" style={{ fontFamily: 'Simonetta, serif' }}>
                    Your Network
                </h1>

{isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                        <p className="text-gray-400 text-sm">Loading your network...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <p className="text-red-400 text-sm mb-4">{error}</p>
                        <button 
                            onClick={fetchConnections}
                            className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : connections.length === 0 ? (
                    <p className="text-gray-400 text-sm">
                        Your network connections will appear here
                    </p>
                ) : (
                    <div className="w-full max-w-md space-y-3">
                        {connections.map((connection) => (
                            <div
                                key={connection.id}
                                onClick={() => handleConnectionClick(connection.id)}
                                className="bg-slate-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-slate-600 transition-colors"
                            >
                                <div className='flex items-center'>
                                    <div className='w-10 h-10 rounded-full mr-4 overflow-hidden'>
                                        <img
                                            src={`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${connection.profile_picture || connection.name}`}
                                            alt="avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-white text-sm font-medium" style={{ fontFamily: 'Simonetta, serif' }}>
                                            {connection.name}
                                        </h3>
                                        <p className="text-gray-400 text-xs mt-1">
                                            {connection.last_interaction_at ? 
                                              `Last interaction ${formatRelativeTime(new Date(connection.last_interaction_at))}` : 
                                              `Connected ${formatRelativeTime(new Date(connection.created_at))}`}
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
