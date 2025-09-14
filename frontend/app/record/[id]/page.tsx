"use client";

import { useEffect, useRef, useState } from "react";
import {useRouter} from "next/navigation";
import { MoveUpLeft, Play, Pause, Phone, MessageSquare } from "lucide-react";

type Props = { params?: { id: string } };
type ViewState = 'recording' | 'transcription';

export default function ConversationPage({ params }: Props) {
  const id = params?.id || "1";
  const [currentView, setCurrentView] = useState<ViewState>('recording');
  const router = useRouter()

  return (
    <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col">
      <button className="w-[30px] h-[30px] mt-5 ml-5 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100/10 transition-colors">
        <MoveUpLeft onClick={() => router.back()} className="w-4 h-4 text-white" />
      </button>

      <div className="flex-1 flex flex-col items-center px-6">
        <h1 className="text-2xl font-normal text-gray-200 mb-1" style={{ fontFamily: "Simonetta, serif" }}>
          Conversation {id}
        </h1>
        <p className="text-[10px] text-gray-400 mb-4">13:10 - 15:10, Jan 2, 2025</p>

        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
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
          </div>

          <div className="space-y-8">
            {/* Conditional Content Based on Current View */}
            {currentView === 'recording' ? (
              <AudioPlayer
                src="/song.mp3"
                className="rounded-2xl p-4"
              />
            ) : (
              <TranscriptionView />
            )}
          </div>

          {/* Toggle Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setCurrentView('recording')}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl transition-colors ${
                currentView === 'recording'
                  ? 'bg-[#353E41] text-white'
                  : 'bg-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Phone className="w-4 h-4" />
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
              <MessageSquare className="w-4 h-4" />
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

function TranscriptionView({ className = "" }: { className?: string }) {
    // Mock conversation data
    const messages = [
      {
        id: 1,
        speaker: "Person 1",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium.",
        isCurrentUser: false,
        avatar: "bg-gradient-to-br from-pink-500 to-blue-600"
      },
      {
        id: 2,
        speaker: "Person 2",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis.",
        isCurrentUser: true,
        avatar: "bg-gradient-to-br from-green-500 to-teal-600"
      },
      {
        id: 3,
        speaker: "Person 1", 
        text: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.",
        isCurrentUser: false,
        avatar: "bg-gradient-to-br from-pink-500 to-blue-600"
      },
      {
        id: 4,
        speaker: "Person 2",
        text: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
        isCurrentUser: true,
        avatar: "bg-gradient-to-br from-green-500 to-teal-600"
      }
    ];
  
    return (
      <div className={`${className} h-[400px] overflow-y-auto`}>
        <div className="space-y-4 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.isCurrentUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex-shrink-0 ${message.avatar}`} />
              
              {/* Message Content */}
              <div
                className={`max-w-[70%] ${
                  message.isCurrentUser ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-2xl text-[8px] leading-relaxed ${
                    message.isCurrentUser
                      ? 'bg-white/30 text-white rounded-br-md'
                      : 'bg-[#353E41] text-white rounded-bl-md'
                  }`}
                >
                  "{message.text}"
                </div>
              </div>
            </div>
          ))}
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

