"use client";

import { useEffect, useRef, useState } from "react";
import { MoveUpLeft, Play, Pause } from "lucide-react";

type Props = { params?: { id: string } };
type ViewState = 'recording' | 'transcription';

export default function ConversationPage({ params }: Props) {
  const id = params?.id || "1";
  const [currentView, setCurrentView] = useState<ViewState>('recording');

  return (
    <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col">
      <button className="w-[30px] h-[30px] mt-5 ml-5 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100/10 transition-colors">
        <MoveUpLeft className="w-4 h-4 text-white" />
      </button>

      <div className="flex-1 flex flex-col items-center px-6">
        <h1 className="text-2xl font-normal text-gray-200 mb-1" style={{ fontFamily: "Simonetta, serif" }}>
          Conversation {id}
        </h1>
        <p className="text-[10px] text-gray-400 mb-4">13:10 - 15:10, Jan 2, 2025</p>

        <div className="w-full max-w-md space-y-4">
          <div className="bg-[#353E41] rounded-2xl p-4 flex items-center hover:bg-slate-600/60 transition-colors">
            <p className="text-[10px]">
              This is a summary of the convo. This is a summary of the convo. This is a summary of the convo. This is a
              summary of the convo. This is a summary of the convo.
              This is a summary of the convo. This is a summary of the convo. This is a summary of the convo. This is a
              summary of the convo. This is a summary of the convo.
              This is a summary of the convo. This is a summary of the convo. This is a summary of the convo. This is a
              summary of the convo. This is a summary of the convo.
            </p>
          </div>

          {/* Conditional Content Based on Current View */}
          {currentView === 'recording' ? (
            <AudioPlayer
              src="/song.mp3"
              className="bg-[#22272A] rounded-2xl p-4"
            />
          ) : (
            <div className="bg-[#22272A] rounded-2xl p-8 h-[400px] flex items-center justify-center">
              <h2 className="text-xl text-gray-200 text-center">
                Transcription View
              </h2>
            </div>
          )}

          {/* Toggle Buttons */}
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => setCurrentView('recording')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-colors ${
                currentView === 'recording'
                  ? 'bg-[#353E41] text-white'
                  : 'bg-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current" />
              <span className="text-sm">Recording</span>
            </button>
            
            <button
              onClick={() => setCurrentView('transcription')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-colors ${
                currentView === 'transcription'
                  ? 'bg-[#353E41] text-white'
                  : 'bg-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="w-4 h-3 border border-current rounded-sm flex items-end justify-center pb-0.5">
                <div className="w-1 h-1 bg-current rounded-full" />
              </div>
              <span className="text-sm">Transcription</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Equalizer({ isPlaying }: { isPlaying: boolean }) {
  const bars = 7;
  
  return (
    <div className="flex items-center justify-center gap-1 h-8 mb-2">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-white/60 rounded-full transition-all duration-150 ${
            isPlaying ? 'animate-pulse' : 'opacity-30'
          }`}
          style={{
            height: isPlaying ? `${Math.random() * 20 + 8}px` : '4px',
            animationDelay: `${i * 100}ms`,
            animationDuration: `${400 + Math.random() * 200}ms`,
          }}
        />
      ))}
    </div>
  );
}

function AudioPlayer({ src, className = "" }: { src: string; className?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0); // seconds
  const [duration, setDuration] = useState(0); // seconds
  const [seeking, setSeeking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => !seeking && setCurrent(a.currentTime || 0);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
    };
  }, [seeking]);

  // Animate equalizer bars when playing
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        // This will trigger re-renders to animate the bars
        const bars = document.querySelectorAll('.equalizer-bar');
        bars.forEach((bar, i) => {
          const height = Math.random() * 20 + 8;
          (bar as HTMLElement).style.height = `${height}px`;
        });
      }, 150);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      await a.play();
      setIsPlaying(true);
    } else {
      a.pause();
      setIsPlaying(false);
    }
  };

  const onSliderChange = (v: string) => {
    const val = Number(v);
    setCurrent(val);
  };

  const onSliderCommit = () => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = current;
    setSeeking(false);
  };

  return (
    <div className={`${className} h-[400px] flex flex-col`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Equalizer Animation - Takes most of the height */}
      <div className="h-[60%] flex items-center justify-center p-4">
        <div className="flex items-end justify-center gap-1.5 w-full h-full">
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={i}
              className={`equalizer-bar w-2.5 bg-white/70 rounded-full transition-all duration-150 ${
                isPlaying ? '' : 'opacity-30'
              }`}
              style={{
                height: isPlaying ? `${Math.random() * 80 + 20}%` : '15%',
              }}
            />
          ))}
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex-1 flex flex-col items-center justify-between p-6 pt-0">
        {/* Slider at the top of controls */}
        <div className="w-full mb-6">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={Number.isFinite(current) ? current : 0}
            onChange={(e) => onSliderChange(e.target.value)}
            onMouseDown={() => setSeeking(true)}
            onMouseUp={onSliderCommit}
            onTouchStart={() => setSeeking(true)}
            onTouchEnd={onSliderCommit}
            className="w-full accent-white cursor-pointer"
          />
        </div>

        {/* Time and Play/Pause */}
        <div className="flex flex-col items-center w-full">
          <span className="text-xl tabular-nums text-gray-200 mb-6">
            {fmt(current)}
          </span>
          
          <button
            onClick={togglePlay}
            className="h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? 
              <Pause className="h-6 w-6 fill-current" /> : 
              <Play className="h-6 w-6 fill-current ml-0.5" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}

function fmt(seconds: number) {
  if (!Number.isFinite(seconds)) return "00:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const two = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${two(h)}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
}