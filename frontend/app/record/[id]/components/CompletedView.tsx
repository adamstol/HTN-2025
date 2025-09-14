"use client";

import { useState } from "react";
import { Play, Pause, Download, Users, Clock, FileText } from "lucide-react";

interface CompletedViewProps {
  conversationId: string;
  conversation: any;
}

export default function CompletedView({ conversationId, conversation }: CompletedViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);

  // Parse transcript data from conversation fields
  const transcript = conversation.transcript || [];
  const facts = conversation.facts || {};
  const summary = conversation.summary || "";

  // Get unique speakers
  const speakers: string[] = Array.from(new Set(transcript.map((turn: any) => turn.speaker).filter((speaker: any): speaker is string => typeof speaker === 'string')));

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement actual audio playback
  };

  const handleDownload = () => {
    // Create downloadable transcript
    const transcriptText = transcript
      .map((turn: any) => `${turn.speaker}: ${turn.text}`)
      .join('\n\n');

    const fullContent = `CONVERSATION TRANSCRIPT\n\nSummary:\n${summary}\n\n${transcriptText}\n\nKey Facts:\n${Object.entries(facts)
      .map(([speaker, speakerFacts]: [string, any]) =>
        `${speaker}:\n${speakerFacts.map((fact: string) => `- ${fact}`).join('\n')}`
      )
      .join('\n\n')}`;

    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversationId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="bg-[#353E41] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Conversation Complete</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePlayPause}
              className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Conversation Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">
              today 10:15:24
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">
              2 participants
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-[#353E41] rounded-2xl p-6">
          <h3 className="text-lg font-medium mb-3">Summary</h3>
          <p className="text-gray-300 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Speaker Filter */}
      {speakers.length > 1 && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Filter by speaker:</span>
          <button
            onClick={() => setSelectedSpeaker(null)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedSpeaker === null
                ? 'bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            All
          </button>
          {speakers.map((speaker) => (
            <button
              key={speaker}
              onClick={() => setSelectedSpeaker(speaker)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedSpeaker === speaker
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {speaker}
            </button>
          ))}
        </div>
      )}

      {/* Transcript */}
      <div className="bg-[#353E41] rounded-2xl p-6">
        <h3 className="text-lg font-medium mb-4">Transcript</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {transcript
            .filter((turn: any) => !selectedSpeaker || turn.speaker === selectedSpeaker)
            .map((turn: any, index: number) => (
              <div key={index} className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs font-medium text-white">
                    {turn.speaker.charAt(0)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-200">
                      {turn.speaker}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{turn.text}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Key Facts */}
      {Object.keys(facts).length > 0 && (
        <div className="bg-[#353E41] rounded-2xl p-6">
          <h3 className="text-lg font-medium mb-4">Key Facts</h3>
          <div className="grid gap-4">
            {Object.entries(facts).map(([speaker, speakerFacts]: [string, any]) => (
              <div key={speaker} className="space-y-2">
                <h4 className="font-medium text-gray-200">{speaker}</h4>
                <ul className="space-y-1 ml-4">
                  {speakerFacts.map((fact: string, index: number) => (
                    <li key={index} className="text-gray-300 text-sm flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
