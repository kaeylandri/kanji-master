// app/kalender/page.tsx
"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout"; // 🆕 Import AppLayout yang benar
import { getLuckyDayData } from "@/utils/luckyEngine";

type DayInfo = {
  dateString: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isLucky: boolean;
  multiplier: number;
};

export default function KalenderPage() {
  const [days, setDays] = useState<DayInfo[]>([]);
  const [multiplier, setMultiplier] = useState(0);

  useEffect(() => {
    const data = getLuckyDayData();
    setMultiplier(data.multiplier);

    const today = new Date();
    const result: DayInfo[] = [];
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      const dateString = d.toISOString().split("T")[0];
      const isLucky = dateString === data.luckyDate;
      const isToday = i === 0;

      result.push({
        dateString,
        dayName: dayNames[d.getDay()],
        dayNumber: d.getDate(),
        isToday,
        isLucky,
        multiplier: isLucky ? data.multiplier : 0,
      });
    }
    setDays(result);
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-8 text-center">
          <div className="text-5xl mb-3">📅</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Kalender Keberuntungan</h1>
          <p className="text-slate-500">Pantau hari spesial di mana hadiahmu berlipat ganda!</p>
        </header>

        {/* Info Hari Keberuntungan */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-8 mb-8 text-white shadow-lg text-center relative overflow-hidden">
          <div className="absolute -left-10 -top-10 text-9xl opacity-20">✨</div>
          <div className="absolute -right-10 -bottom-10 text-9xl opacity-20">🎁</div>
          <h2 className="text-2xl font-bold mb-2">Hari Keberuntungan Berikutnya</h2>
          <p className="text-4xl font-black mb-2">
            {days.find(d => d.isLucky)?.dayName}, {days.find(d => d.isLucky)?.dayNumber}
          </p>
          <p className="text-amber-100 font-semibold">
            Dapatkan <span className="text-white font-bold text-xl">{multiplier}x lipat</span> EXP & Koin Sakura!
          </p>
        </div>

        {/* Grid Kalender 14 Hari */}
        <div className="grid grid-cols-7 gap-1.5 md:gap-3">
          {days.map((day, idx) => (
            <div
              key={idx}
              className={`rounded-xl md:rounded-2xl p-2 md:p-4 flex flex-col items-center justify-center border-2 transition-all ${
                day.isToday
                  ? "border-blue-500 bg-blue-50 shadow-md scale-105"
                  : day.isLucky
                  ? "border-amber-400 bg-gradient-to-br from-amber-100 to-orange-100 shadow-md scale-105"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className={`text-[10px] md:text-xs font-bold mb-1 ${
                day.isToday ? "text-blue-600" : day.isLucky ? "text-amber-600" : "text-slate-400"
              }`}>
                {day.dayName}
              </div>
              <div className={`text-lg md:text-2xl font-bold ${
                day.isToday ? "text-blue-700" : day.isLucky ? "text-amber-700" : "text-slate-700"
              }`}>
                {day.dayNumber}
              </div>
              {day.isLucky && <div className="text-sm md:text-xl mt-1 animate-pulse">🎁</div>}
              {day.isToday && !day.isLucky && <div className="text-[8px] md:text-xs text-blue-500 font-bold mt-1">Hari Ini</div>}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-slate-600 text-sm md:text-base">
            <strong>Bagaimana cara kerjanya?</strong> <br/>
            Setiap 2 minggu sekali, sistem akan memilih 1 hari secara acak. 
            Jika kamu belajar di hari tersebut, semua hadiah dari misi akan dikali <strong>{multiplier}x lipat</strong>.
            Jangan sampai terlewat!
          </p>
        </div>

      </div>
    </AppLayout>
  );
}