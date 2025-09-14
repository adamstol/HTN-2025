"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Mic, Users, Clock } from "lucide-react";
import BubbleField from "@/components/BubbleField";
import CircleBlobs from "@/components/CloudButton";
import { createClient } from "@/lib/supabase/client";
import { sendTranscriptClient } from "@/lib/transcripts/client";

interface CurrentViewProps {
  conversationId: string;
}

export default function CurrentView({ conversationId }: CurrentViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState<"pending" | "active" | "ended">("active");
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [storedStartTime, setStoredStartTime] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptResult, setTranscriptResult] = useState<any>(null);
  const [autoStarted, setAutoStarted] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize duration from localStorage and database
  useEffect(() => {
    const initializeDuration = async () => {
      // Check localStorage for stored start time
      const storageKey = `conversation_${conversationId}_start_time`;
      const storedTime = localStorage.getItem(storageKey);

      if (storedTime) {
        const parsedTime = parseInt(storedTime);
        setStoredStartTime(parsedTime);
        setStartTime(parsedTime);

        // Calculate current duration
        const currentDuration = Math.floor((Date.now() - parsedTime) / 1000);
        setDuration(currentDuration);
      }

      // Also check database for official start time
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('status, started_at')
          .eq('id', conversationId)
          .single();

        if (!error && data) {
          setStatus(data.status);

          if (data.started_at) {
            const dbStartTime = new Date(data.started_at).getTime();

            // If no stored time or db time is different, use db time
            if (!storedTime || Math.abs(dbStartTime - (storedTime ? parseInt(storedTime) : 0)) > 5000) {
              setStartTime(dbStartTime);
              setStoredStartTime(dbStartTime);
              localStorage.setItem(storageKey, dbStartTime.toString());

              // Recalculate duration with db time
              const currentDuration = Math.floor((Date.now() - dbStartTime) / 1000);
              setDuration(currentDuration);
            }
          } else if (!storedTime) {
            // No start time in db or storage, use current time
            const now = Date.now();
            setStartTime(now);
            setStoredStartTime(now);
            localStorage.setItem(storageKey, now.toString());
          }
        }
      } catch (err) {
        console.error("Error initializing duration:", err);
      }
    };

    initializeDuration();
  }, [conversationId, supabase]);

  // Real-time status monitoring
  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout;

    console.log("CurrentView - Conversation status:", status);
    console.log("CurrentView - Conversation ID:", conversationId);

    // Function to check conversation status and start time
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('status, started_at')
          .eq('id', conversationId)
          .single();

        if (!error && data && mounted) {
          console.log("CurrentView - Polled conversation status:", data.status);
          setStatus(data.status);

          // Update start time if it changed in database
          if (data.started_at) {
            const dbStartTime = new Date(data.started_at).getTime();
            if (Math.abs(dbStartTime - startTime) > 5000) {
              setStartTime(dbStartTime);
              setStoredStartTime(dbStartTime);
              localStorage.setItem(`conversation_${conversationId}_start_time`, dbStartTime.toString());
            }
          }
        }
      } catch (err) {
        console.error("CurrentView - Error polling conversation status:", err);
      }
    };

    // Initial status check
    checkStatus();

    // Try real-time subscription first
    const ch = supabase
      .channel(`conv:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`
        },
        (payload) => {
          console.log("CurrentView - Real-time conversation status updated:", payload.new);
          const row: any = payload.new;
          if (mounted && row?.status) {
            setStatus(row.status);

            // Update start time if it changed
            if (row.started_at) {
              setStartTime(new Date(row.started_at).getTime());
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('CurrentView - Successfully subscribed to conversation updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('CurrentView - Channel subscription error:', err);
          // Fallback to polling if real-time fails
          pollInterval = setInterval(checkStatus, 2000);
        }
      });

    // Fallback polling after 5 seconds if no real-time updates
    const fallbackTimeout = setTimeout(() => {
      if (mounted && status === 'active') {
        console.log('CurrentView - Starting fallback polling for conversation status');
        pollInterval = setInterval(checkStatus, 2000);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      if (pollInterval) clearInterval(pollInterval);
      supabase.removeChannel(ch);
    };
  }, [conversationId, supabase, status]);

  // Auto-start recording when component mounts
  useEffect(() => {
    if (!autoStarted) {
      setAutoStarted(true);
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        startRecording();
      }, 500);
    }
  }, [autoStarted]);

  // Timer for recording duration with localStorage sync
  useEffect(() => {
    const interval = setInterval(() => {
      const newDuration = Math.floor((Date.now() - startTime) / 1000);
      setDuration(newDuration);

      // Store current duration in localStorage for persistence
      localStorage.setItem(`conversation_${conversationId}_duration`, newDuration.toString());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, conversationId]);

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

      recorder.onstop = async () => {
        // Create audio blob from collected chunks
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(audioBlob);

        // Clean up
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);

        // Send to transcript API
        setIsProcessing(true);
        try {
          const audioFile = new File(
            [audioBlob],
            `recording-${Date.now()}.webm`,
            { type: "audio/webm" }
          );

          console.log("Sending audio to transcript API:", audioFile);
          const result = await sendTranscriptClient({
            file: audioFile,
            conversationId
          });
          console.log("Transcript API result:", result);

          setTranscriptResult(result);
                  // Update the conversation with transcript data
          const { error } = await supabase
          .from('conversations')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            // transcript: result.transcript,
            summary: result.summary,
            // facts: result.facts
            // Note: Based on schema, there's no transcript field, so we store in location for now
          })
          .eq('id', conversationId);

          if (error) {
            console.error("Error updating conversation:", error);
            alert("Error updating conversation. Please try again.");
          }
        } catch (error) {
          console.error("Error processing transcript:", error);
          alert("Error processing recording. Please try again.");
        } finally {
          setIsProcessing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Unable to access microphone. Please check permissions.");
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Main Content - Circle Section */}
      <div className="flex items-center justify-center px-6">
        <BubbleField isRecording={isRecording} />

        <div className="flex flex-col items-center">
          {/* Record Circle */}
          <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
            {/* White aura / glow */}
            {isRecording && (
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: "0 0 30px 15px rgba(255,255,255,0.5)",
                  animation: "pulseAura 1.5s infinite alternate",
                }}
              />
            )}

            {/* Actual button */}
            <button
              onClick={handleRecordClick}
              disabled={isProcessing}
              className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all cursor-pointer
                ${isRecording ? "bg-white/80" : "bg-gray-300"}
                ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}>
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
              ) : isRecording ? (
                <div className="">
                  <CircleBlobs
                    isRecording={true}
                    onClick={handleRecordClick}
                  />
                </div>
              ) : (
                <Mic className="w-8 h-8 text-gray-700" />
              )}
            </button>
          </div>

          {/* Add this CSS in your global stylesheet or tailwind config */}
          <style jsx>{`
            @keyframes pulseAura {
              0% {
                box-shadow: 0 0 5px 5px rgba(255, 255, 255, 0.4);
              }
              100% {
                box-shadow: 0 0 15px 10px rgba(255, 255, 255, 0.6);
              }
            }
          `}</style>

          {/* Status text */}
          <div className="text-center mb-6">
            <p
              className="text-gray-300 text-lg"
              style={{ fontFamily: "Simonetta, serif" }}>
              {isProcessing ? "Processing..." : isRecording ? "Recording..." : "Tap to record..."}
            </p>
          </div>
        </div>
      </div>

      {/* Recording Stats */}
      <div className="bg-[#353E41] rounded-2xl p-4 w-full space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Duration</span>
          </div>
          <span className="text-lg font-mono text-white">
            {formatDuration(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Participants</span>
          </div>
          <span className="text-sm text-white">
            1 active
          </span>
        </div>
      </div>

      {/* Transcript Results */}
      {transcriptResult && (
        <div className="bg-[#353E41] rounded-2xl p-4 space-y-4">
          <h3 className="text-lg font-medium">Recording Complete!</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              {transcriptResult.transcript?.length || 0} conversation turns processed
            </p>
            {transcriptResult.summary && (
              <p className="text-xs text-gray-400">
                {transcriptResult.summary}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-400">
          Continue your conversation naturally
        </p>
        <p className="text-xs text-gray-500">
          Recording will stop automatically when the conversation ends
        </p>
      </div>
    </div>
  );
}
