"use client";

import { ChevronLeft, MoveUpRight } from 'lucide-react';
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
    // Generate random connections with avatars
    const generateRandomConnections = () => {
        const connectionNames = ['Alex Johnson', 'Sarah Chen', 'Michael Rodriguez', 'Emma Wilson', 'David Kim'];
        const timeOptions = ['Connected 2 hours ago', 'Connected yesterday', 'Connected 3 days ago', 'Connected 1 week ago', 'Connected 2 weeks ago'];

        return connectionNames.map((name, index) => {
            const randomAvatarIndex = Math.floor(Math.random() * avatarNames.length);
            const randomTimeIndex = Math.floor(Math.random() * timeOptions.length);

            return {
                id: (index + 1).toString(),
                name,
                timeConnected: timeOptions[randomTimeIndex],
                profilePicture: avatarNames[randomAvatarIndex]
            };
        });
    };

    const [connections] = useState<Connection[]>(generateRandomConnections());

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
                                    <div className='w-10 h-10 rounded-full mr-4 overflow-hidden'>
                                        <img
                                            src={`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${connection.profilePicture}`}
                                            alt="avatar"
                                            className="w-full h-full object-cover"
                                        />
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
