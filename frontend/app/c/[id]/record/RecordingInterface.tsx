'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Users, Phone } from 'lucide-react';
import { sendTranscriptClient } from '@/lib/transcripts/client';

interface RecordingInterfaceProps {
  conversationId: string;
  userId: string;
  isInitiator: boolean;
  conversationStatus: string;
}

export default function RecordingInterface({
  conversationId,
  userId,
  isInitiator,
  conversationStatus
}: RecordingInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);

        // Process the recording
        setProcessing(true);
        try {
          const result = await sendTranscriptClient({
            file: new File([audioBlob], 'recording.webm', { type: 'audio/webm' }),
            conversationId: conversationId
          });
          console.log('Transcript result:', result);
        } catch (error) {
          console.error('Failed to process recording:', error);
        } finally {
          setProcessing(false);
        }

        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
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

  return (
    <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 pt-8 pb-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-gray-300" />
            <div>
              <h1 className="text-lg font-medium">Conversation</h1>
              <p className="text-sm text-gray-400">
                {isInitiator ? 'You started this conversation' : 'You joined this conversation'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              conversationStatus === 'active' ? 'bg-green-500' :
              conversationStatus === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
            }`} />
            <span className="text-sm text-gray-300 capitalize">{conversationStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Recording Area */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="flex flex-col items-center space-y-8">
          {/* Recording Button */}
          <button
            onClick={handleRecordClick}
            disabled={processing}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : processing
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {processing ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isRecording ? (
              <Square className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>

          {/* Status Text */}
          <div className="text-center space-y-2">
            <p className="text-xl font-medium">
              {processing ? 'Processing...' : isRecording ? 'Recording...' : 'Tap to Record'}
            </p>
            <p className="text-gray-400 text-sm">
              {processing
                ? 'Transcribing and analyzing your conversation'
                : isRecording
                ? 'Speak naturally, we\'ll capture everything'
                : 'Start recording your conversation'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex-shrink-0 pb-8 px-6">
        <div className="flex justify-center space-x-4">
          <button className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg transition-colors">
            <Phone className="w-5 h-5" />
            <span>End Call</span>
          </button>
        </div>
      </div>

      {/* Debug Info */}
      {audioBlob && (
        <div className="fixed bottom-4 right-4 bg-slate-800 p-4 rounded-lg text-xs">
          <p>Recording saved: {(audioBlob.size / 1024).toFixed(1)}KB</p>
        </div>
      )}
    </div>
  );
}
