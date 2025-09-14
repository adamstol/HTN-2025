"use client";

import { useState, useRef } from 'react';
import { Users, Sparkles, MoveUpRight, Mic, Square } from 'lucide-react';
import ConversationHistory from '@/components/ConversationHistory';
import { sendTranscriptClient } from '@/lib/transcripts/client';


export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptResult, setTranscriptResult] = useState<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const conversationHistoryRef = useRef<HTMLDivElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      // Clear previous audio chunks
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Create MP3 blob from collected chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setAudioBlob(audioBlob);

        // Create download URL for the MP3
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('Recording completed. Audio blob created:', audioBlob);
        console.log('Download URL:', audioUrl);

        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);

        // Send to transcript API
        setIsProcessing(true);
        try {
          // Convert blob to File for the API
          const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
            type: 'audio/webm'
          });

          console.log('Sending audio to transcript API:', audioFile);
          const result = await sendTranscriptClient({ file: audioFile });
          console.log('Transcript API result:', result);

          setTranscriptResult(result);
        } catch (error) {
          console.error('Error processing transcript:', error);
          alert('Error processing recording. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleViewConversationHistory = () => {
    // Immediately scroll to conversation history section
    conversationHistoryRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleScrollBackComplete = () => {
    // Scroll back to top completed
    console.log('Scroll back completed');
  };

  return (
    <>
      {/* Record Page Section - Always 100vh */}
      <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col">
        {/* Header Section */}
        <div className="flex-shrink-0 pt-16 pb-8 px-6">
          <div className="text-center">
            <h1 className="text-xl font-normal text-gray-200" style={{fontFamily: 'Simonetta, serif'}}>
              Hi, how can I help you today?
            </h1>
          </div>
        </div>

        {/* Main Content - Circle Section */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="flex flex-col items-center">
            {/* Record Circle */}
            <button
              onClick={handleRecordClick}
              className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-colors cursor-pointer hover:opacity-80 ${
                isRecording ? 'bg-gray-500' : 'bg-gray-300'
              }`}
            >
              {isRecording ? (
                <Square className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-gray-700" />
              )}
            </button>

            {/* Tap to record text */}
            <div className="text-center">
              <p className="text-gray-300 text-lg" style={{fontFamily: 'Simonetta, serif'}}>
                {isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Tap to record...'}
              </p>

              {/* Transcript Results */}
              {transcriptResult && (
                <div className="mt-4 p-4 bg-slate-800 rounded-lg max-w-md">
                  <h3 className="text-white text-sm font-semibold mb-2">Conversation:</h3>
                  {transcriptResult.conversation && transcriptResult.conversation.map((turn: any, index: number) => (
                    <div key={index} className="mb-2 text-left">
                      <span className="text-blue-300 font-medium">{turn.speaker}:</span>
                      <span className="text-gray-200 ml-2">{turn.text}</span>
                    </div>
                  ))}

                  {transcriptResult.analysis && (
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <h4 className="text-white text-xs font-semibold mb-1">Analysis:</h4>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(transcriptResult.analysis, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - Two Side-by-Side Cards */}
        <div className="flex-shrink-0 pb-8 px-6">
          <div className="space-y-4">
            {/* Two Cards Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Access your network card */}
              <div className="bg-slate-700 rounded-2xl p-4 h-24 flex flex-col cursor-pointer hover:bg-slate-600 transition-colors">
                <div className="w-6 h-6 flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex items-center justify-between flex-1">
                  <p className="text-white text-xs ">Access network</p>
                  <MoveUpRight className="w-3 h-3 text-gray-400" />
                </div>
              </div>

              {/* AI Chatbot card */}
              <div className="bg-slate-700 rounded-2xl p-4 h-24 flex flex-col cursor-pointer hover:bg-slate-600 transition-colors">
                <div className="w-6 h-6 flex items-center justify-center mb-2">
                  <Sparkles className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex items-center justify-between flex-1">
                  <p className="text-white text-xs">AI Chatbot</p>
                  <MoveUpRight className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            </div>

            {/* View Conversation History */}
            <div className="flex justify-center items-center pt-4">
              <button
                onClick={handleViewConversationHistory}
                className="text-gray-400 text-sm hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <span>View Conversation History</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation History Section - Separate 100vh section */}
      <div ref={conversationHistoryRef}>
        <ConversationHistory onScrollBack={handleScrollBackComplete} />
      </div>
    </>
  );
}
