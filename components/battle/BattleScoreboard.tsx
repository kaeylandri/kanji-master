// components/battle/BattleScoreboard.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BattleParticipant } from "@/utils/battleTypes";

interface Props {
  me: BattleParticipant;
  opponent: BattleParticipant;
  endsAt: string;
  isPaused: boolean;
}

export default function BattleScoreboard({ me, opponent, endsAt, isPaused }: Props) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (isPaused) return;
    const updateTimer = () => {
      const remaining = Math.max(0, new Date(endsAt).getTime() - Date.now());
      setTimeLeft(Math.ceil(remaining / 1000));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endsAt, isPaused]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = (timeLeft / 120) * 100;

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        {/* Player Me */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 border-2 border-blue-500 overflow-hidden mb-2">
            {me.profiles?.avatar_url ? (
              <Image src={me.profiles.avatar_url} alt="Me" width={64} height={64} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-blue-500 font-bold text-xl">
                {me.profiles?.username?.charAt(0) || "?"}
              </div>
            )}
          </div>
          <span className="font-semibold text-slate-700">{me.profiles?.username || "Kamu"}</span>
          <span className="text-2xl font-bold text-blue-600">{me.score}</span>
          <span className="text-xs text-slate-500">{me.correct_count} benar</span>
        </div>

        {/* Timer Center */}
        <div className="flex flex-col items-center justify-center px-4">
          <div className="text-3xl font-black text-slate-800 mb-1">VS</div>
          <div className={`text-xl font-bold px-4 py-1 rounded-full ${timeLeft <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-orange-100 text-orange-600'}`}>
            {formatTime(timeLeft)}
          </div>
          <span className="text-xs text-slate-400 mt-1">Sisa waktu</span>
        </div>

        {/* Player Opponent */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-16 h-16 rounded-2xl bg-pink-100 border-2 border-pink-500 overflow-hidden mb-2">
            {opponent.profiles?.avatar_url ? (
              <Image src={opponent.profiles.avatar_url} alt="Opponent" width={64} height={64} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-pink-500 font-bold text-xl">
                {opponent.profiles?.username?.charAt(0) || "?"}
              </div>
            )}
          </div>
          <span className="font-semibold text-slate-700">{opponent.profiles?.username || "Lawan"}</span>
          <span className="text-2xl font-bold text-pink-600">{opponent.score}</span>
          <span className="text-xs text-slate-500">{opponent.correct_count} benar</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 10 ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-center text-xs text-slate-400 mt-2">Progress waktu pertandingan</p>
    </div>
  );
}