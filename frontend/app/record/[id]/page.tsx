"use client";

import { useEffect, useRef, useState } from "react";
import { MoveUpLeft, Play, Pause } from "lucide-react";

type Props = { params: { id: string } };

export default function ConversationPage({ params }: Props) {
  const { id } = params;
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
            </p>
          </div>

          {/* Audio Player */}
          <AudioPlayer
            src="/song.mp3" // <- replace with your audio URL or blob URL
            className="bg-[#22272A] rounded-2xl p-4"
          />
        </div>
      </div>
    </div>
  );
}

function AudioPlayer({ src, className = "" }: { src: string; className?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0); // seconds
  const [duration, setDuration] = useState(0); // seconds
  const [seeking, setSeeking] = useState(false);

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
    <div className={className}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Slider */}
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

      {/* Time + Play/Pause */}
      <div className="mt-3 flex items-center justify-between flex-col">
        <span className="text-xl tabular-nums text-gray-200 mb-3">{fmt(current)}</span>
        <button
          onClick={togglePlay}
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
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
