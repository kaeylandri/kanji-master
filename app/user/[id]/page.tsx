// app/user/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import AppLayout from "@/components/AppLayout"; // Cukup AppLayout saja
import { triggerToast } from "@/utils/toast";
import { ACHIEVEMENTS_KANJI } from "@/data/achievements-kanji";
import { ACHIEVEMENTS_KOTOBA } from "@/data/achievements";

function getTitle(mastered: number) {
  if (mastered >= 462) return { name: "Kanji Grandmaster", subtitle: "Ultimate Achievement", color: "from-yellow-400 to-amber-600", emoji: "👑" };
  if (mastered >= 365) return { name: "Kanji Master", subtitle: "The Master", color: "from-purple-500 to-fuchsia-700", emoji: "🥋" };
  if (mastered >= 243) return { name: "Kanji Samurai", subtitle: "The Disciplined", color: "from-blue-600 to-indigo-800", emoji: "⚔️" };
  if (mastered >= 122) return { name: "Kanji Warrior", subtitle: "The Fighter", color: "from-red-500 to-rose-700", emoji: "🛡️" };
  if (mastered >= 49) return { name: "Kanji Apprentice", subtitle: "The Learner", color: "from-emerald-400 to-teal-600", emoji: "📖" };
  return { name: "Kanji Beginner", subtitle: "The First Step", color: "from-gray-400 to-slate-600", emoji: "🌱" };
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // State Progress & Achievement
  const [masteredKanji, setMasteredKanji] = useState<number[]>([]);
  const [masteredKotoba, setMasteredKotoba] = useState<number[]>([]);
  const [uniqueKotobaAnswered, setUniqueKotobaAnswered] = useState<number[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  
  // State untuk kalkulasi kategori
  const [allKanji, setAllKanji] = useState<any[]>([]);
  const [allKotoba, setAllKotoba] = useState<any[]>([]);

  useEffect(() => {
    const initPage = async () => {
      setIsLoadingData(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) setMyId(authUser.id);

      // 1. Ambil Profil Target
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', params.id).single();
      if (profileData) setUser(profileData);

      // 2. Ambil Progress Hafalan Target
      const { data: progressData } = await supabase.from('user_progress').select('*').eq('user_id', params.id);
      if (progressData) {
        setMasteredKanji(progressData.filter(p => p.item_type === 'kanji' && p.is_mastered).map(p => p.item_id));
        setMasteredKotoba(progressData.filter(p => p.item_type === 'kotoba' && p.is_mastered).map(p => p.item_id));
        setUniqueKotobaAnswered(progressData.filter(p => p.item_type === 'kotoba').map(p => p.item_id));
      }

      // 3. Ambil Data Achievement yang sudah dibuka
      const { data: achData } = await supabase.from('user_achievements').select('*').eq('user_id', params.id);
      if (achData) setUnlockedAchievements(achData.map(a => a.achievement_id));

      // 4. Ambil Data Master Kanji & Kotoba
      const [kanjiRes, kotobaRes] = await Promise.all([
        fetch("/api/categories/semua/kanji"),
        fetch("/api/kotoba/semua")
      ]);
      setAllKanji(await kanjiRes.json());
      setAllKotoba(await kotobaRes.json());

      // 5. Cek Status Pertemanan
      if (authUser && profileData) {
        const { data: friendData } = await supabase
          .from('friends')
          .select('status')
          .or(`and(user_id.eq.${authUser.id},friend_id.eq.${params.id}),and(user_id.eq.${params.id},friend_id.eq.${authUser.id})`)
          .maybeSingle();
        if (friendData) setFriendStatus(friendData.status);
      }

      setIsLoadingData(false);
    };
    initPage();
  }, [params.id]);

  const handleAddFriend = async () => {
    if (!myId || !user) return triggerToast("Login dulu!", "error");
    setLoadingAction(true);
    
    const { error } = await supabase.from('friends').insert([{ user_id: myId, friend_id: user.id, status: 'pending' }]);
    
    if (!error) {
      setFriendStatus('pending');
      triggerToast(`Permintaan terkirim ke ${user.username}! 🎉`, "success");
    } else {
      triggerToast("Gagal mengirim permintaan.", "error");
    }
    setLoadingAction(false);
  };

  if (!user || isLoadingData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-slate-500 animate-pulse font-bold text-lg">
          Memuat profil...
        </div>
      </AppLayout>
    );
  }

  const playerLevel = Math.floor(Math.sqrt(user.total_exp / 50)) + 1;
  const isMe = myId === user.id;
  const title = getTitle(masteredKanji.length);

  const getKotobaProgress = (ach: any) => {
    if (ach.type === "category") {
      const kotobaInCat = allKotoba.filter(k => k.category === ach.categoryTarget);
      const masteredInCat = kotobaInCat.filter(k => uniqueKotobaAnswered.includes(k.id)).length;
      const percent = ach.targetCount ? (masteredInCat / ach.targetCount) * 100 : 0;
      return { current: masteredInCat, target: ach.targetCount, percent: Math.min(percent, 100) };
    } else {
      const isUnlocked = unlockedAchievements.includes(ach.id);
      return { current: isUnlocked ? 1 : 0, target: 1, percent: isUnlocked ? 100 : 0 };
    }
  };

  const getKanjiProgress = (ach: any) => {
    if (ach.type === "category") {
      const kanjiInCat = allKanji.filter((k: any) => k.category?.slug === ach.categoryTarget);
      const masteredInCat = kanjiInCat.filter((k: any) => masteredKanji.includes(k.id)).length;
      const percent = ach.targetCount ? (masteredInCat / ach.targetCount) * 100 : 0;
      return { current: masteredInCat, target: ach.targetCount, percent: Math.min(percent, 100) };
    } else if (ach.type === "progress") {
      const percent = (masteredKanji.length / ach.targetCount) * 100;
      return { current: masteredKanji.length, target: ach.targetCount, percent: Math.min(percent, 100) };
    } else {
      const isUnlocked = unlockedAchievements.includes(ach.id);
      return { current: isUnlocked ? 1 : 0, target: 1, percent: isUnlocked ? 100 : 0 };
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition">
          ← Kembali
        </button>

        {/* Card Profil Utama */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className={`h-48 bg-gradient-to-r ${title.color} relative`}></div>
          
          <div className="px-4 sm:px-8 pb-8 relative flex flex-col items-center text-center">
            <div className="absolute -top-20 flex justify-center w-full left-0">
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-2xl bg-slate-100 flex items-center justify-center text-5xl font-bold text-slate-400 z-10">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            <div className="mt-16 w-full">
              <h1 className="text-3xl font-bold text-slate-800">{user.username}</h1>
              <p className="text-sm text-slate-500 mt-1">Level {playerLevel} • {user.total_exp || 0} Total XP</p>
              
              <div className="mt-3 inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 shadow-sm">
                <span>{title.emoji}</span>
                <span>{title.name} <span className="text-slate-400 font-normal">• {title.subtitle}</span></span>
              </div>
              
              <p className="text-slate-600 mt-4 max-w-md mx-auto">{user.bio || "Halo! Aku sedang belajar bahasa Jepang 🇯🇵"}</p>
              
              {!isMe && (
                <div className="mt-6 flex justify-center">
                  {friendStatus === 'accepted' ? (
                    <button disabled className="bg-slate-100 text-slate-500 font-bold py-3 px-8 rounded-xl border border-slate-200 cursor-not-allowed">
                      🤝 Sudah Berteman
                    </button>
                  ) : friendStatus === 'pending' ? (
                    <button disabled className="bg-emerald-50 text-emerald-600 font-bold py-3 px-8 rounded-xl border border-emerald-200 cursor-not-allowed">
                      ✅ Menunggu Konfirmasi
                    </button>
                  ) : (
                    <button onClick={handleAddFriend} disabled={loadingAction} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-md active:scale-95 disabled:bg-blue-300 transition-all">
                      {loadingAction ? "Mengirim..." : "➕ Tambah Teman"}
                    </button>
                  )}
                </div>
              )}
              {isMe && (
                <div className="mt-6 flex justify-center">
                  <button onClick={() => router.push('/profil')} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-xl shadow-md transition">
                    ⚙️ Edit Profil Kamu
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistik Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-4 shadow-sm">
            <div className="text-2xl sm:text-3xl">🔥</div>
            <div><div className="font-bold text-slate-800 text-lg sm:text-xl">{user.current_streak || 0}</div><div className="text-[10px] sm:text-xs text-slate-500 font-semibold">Streak</div></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-4 shadow-sm">
            <div className="text-2xl sm:text-3xl">🌸</div>
            <div><div className="font-bold text-slate-800 text-lg sm:text-xl">{user.sakura_coins || 0}</div><div className="text-[10px] sm:text-xs text-slate-500 font-semibold">Koin</div></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-4 shadow-sm">
            <div className="text-2xl sm:text-3xl">🏆</div>
            <div><div className="font-bold text-slate-800 text-lg sm:text-xl">{user.longest_streak || 0}</div><div className="text-[10px] sm:text-xs text-slate-500 font-semibold">Rekor Streak</div></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-4 shadow-sm">
            <div className="text-2xl sm:text-3xl">⚡</div>
            <div><div className="font-bold text-slate-800 text-lg sm:text-xl">{user.total_exp || 0}</div><div className="text-[10px] sm:text-xs text-slate-500 font-semibold">Total XP</div></div>
          </div>
        </div>

        {/* Progress Hafalan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <div><h2 className="text-lg sm:text-xl font-bold text-emerald-500">Kanji Dihafal</h2><p className="text-slate-500 text-xs sm:text-sm">{masteredKanji.length} / 486</p></div>
              <span className="text-lg sm:text-xl font-bold text-emerald-500">{((masteredKanji.length / 486) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${(masteredKanji.length / 486) * 100}%` }} /></div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <div><h2 className="text-lg sm:text-xl font-bold text-blue-500">Kotoba Dihafal</h2><p className="text-slate-500 text-xs sm:text-sm">{masteredKotoba.length} / 500</p></div>
              <span className="text-lg sm:text-xl font-bold text-blue-500">{((masteredKotoba.length / 500) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-400 to-blue-500" style={{ width: `${(masteredKotoba.length / 500) * 100}%` }} /></div>
          </div>
        </div>

        {/* Pencapaian Kotoba */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2 sm:gap-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">🏅 Pencapaian Kotoba</h2>
            <Link href={`/profil/achievements?userId=${user.id}`} className="text-xs sm:text-sm font-bold text-blue-500 hover:text-blue-600 transition flex items-center gap-1 bg-blue-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-blue-100">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {ACHIEVEMENTS_KOTOBA.slice(0, 3).map((ach) => {
              const { current, target, percent } = getKotobaProgress(ach);
              const isUnlocked = percent === 100;
              return (
                <div key={ach.id} className={`rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5 border-2 ${isUnlocked ? "bg-white border-emerald-200 shadow-sm" : "bg-slate-50 border-slate-200"} text-center sm:text-left`}>
                  <div className={`shrink-0 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl rounded-xl sm:rounded-2xl border ${isUnlocked ? `${ach.color} border-white/20 shadow-inner` : "bg-slate-100 border-slate-200 text-slate-300"}`}>
                    {isUnlocked ? ach.icon : "🔒"}
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-1">
                      <h3 className={`font-bold text-base sm:text-lg ${isUnlocked ? "text-slate-800" : "text-slate-500"}`}>{ach.name}</h3>
                      <span className={`text-sm font-bold ${isUnlocked ? "text-emerald-500" : "text-slate-400"}`}>{Math.round(percent)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 mt-2">
                      <div className={`h-full ${isUnlocked ? "bg-yellow-400" : "bg-slate-300"}`} style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{current} dari {target} kotoba dijawab benar.</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pencapaian Kanji */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2 sm:gap-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">🏅 Pencapaian Kanji</h2>
            <Link href={`/profil/achievements-kanji?userId=${user.id}`} className="text-xs sm:text-sm font-bold text-blue-500 hover:text-blue-600 transition flex items-center gap-1 bg-blue-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-blue-100">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {ACHIEVEMENTS_KANJI.slice(0, 3).map((ach) => {
              const { current, target, percent } = getKanjiProgress(ach);
              const isUnlocked = percent === 100;
              return (
                <div key={ach.id} className={`rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5 border-2 ${isUnlocked ? "bg-white border-emerald-200 shadow-sm" : "bg-slate-50 border-slate-200"} text-center sm:text-left`}>
                  <div className={`shrink-0 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl rounded-xl sm:rounded-2xl border ${isUnlocked ? `${ach.color} border-white/20 shadow-inner` : "bg-slate-100 border-slate-200 text-slate-300"}`}>
                    {isUnlocked ? ach.icon : "🔒"}
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-1">
                      <h3 className={`font-bold text-base sm:text-lg ${isUnlocked ? "text-slate-800" : "text-slate-500"}`}>{ach.name}</h3>
                      <span className={`text-sm font-bold ${isUnlocked ? "text-emerald-500" : "text-slate-400"}`}>{Math.round(percent)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 mt-2">
                      <div className={`h-full ${isUnlocked ? "bg-yellow-400" : "bg-slate-300"}`} style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{current} dari {target} kanji dihafal.</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}