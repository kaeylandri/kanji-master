// app/profil/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ACHIEVEMENTS_KOTOBA } from "@/data/achievements";
import { ACHIEVEMENTS_KANJI } from "@/data/achievements-kanji";
import { getMissionsState } from "@/utils/missionEngine";
import { getStreakData } from "@/utils/streakEngine";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";

function getTitle(mastered: number) {
  if (mastered >= 462) return { name: "Kanji Grandmaster", subtitle: "Ultimate Achievement", color: "from-yellow-400 to-amber-600", emoji: "👑" };
  if (mastered >= 365) return { name: "Kanji Master", subtitle: "The Master", color: "from-purple-500 to-fuchsia-700", emoji: "🥋" };
  if (mastered >= 243) return { name: "Kanji Samurai", subtitle: "The Disciplined", color: "from-blue-600 to-indigo-800", emoji: "⚔️" };
  if (mastered >= 122) return { name: "Kanji Warrior", subtitle: "The Fighter", color: "from-red-500 to-rose-700", emoji: "🛡️" };
  if (mastered >= 49) return { name: "Kanji Apprentice", subtitle: "The Learner", color: "from-emerald-400 to-teal-600", emoji: "📖" };
  return { name: "Kanji Beginner", subtitle: "The First Step", color: "from-gray-400 to-slate-600", emoji: "🌱" };
}

export default function ProfilPage() {
  const router = useRouter();
  const [masteredKanji, setMasteredKanji] = useState<number[]>([]);
  const [masteredKotoba, setMasteredKotoba] = useState<number[]>([]);
  const [uniqueKotobaAnswered, setUniqueKotobaAnswered] = useState<number[]>([]);
  const [kotobaList, setKotobaList] = useState<any[]>([]);
  const [kanjiList, setKanjiList] = useState<any[]>([]);
  const [isLoadingKanji, setIsLoadingKanji] = useState(true); // 🆕 Loading state untuk kanji favorit
  
  const [profile, setProfile] = useState({
    name: "Pengguna Baru",
    bio: "Halo! Aku sedang belajar bahasa Jepang 🇯🇵",
    avatar: "",
    favoriteKanjiIds: [] as number[],
  });
  
  const [survivalHighScore, setSurvivalHighScore] = useState(0);
  const [examHighScore, setExamHighScore] = useState(0);
  const [randomBestTime, setRandomBestTime] = useState<number | null>(null);
  
  const [unlockedKotoba, setUnlockedKotoba] = useState<string[]>([]);
  const [kanjiStats, setKanjiStats] = useState<any>({});
  const [userExp, setUserExp] = useState(0);
  const [sakuraCoins, setSakuraCoins] = useState(0);
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [streak, setStreak] = useState<any>(null);
  
  const [friendsList, setFriendsList] = useState<any[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(profile);

  // 🆕 Fungsi Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  useEffect(() => {
    const loadStreak = () => setStreak(getStreakData());

    try {
      // 🆕 PENGAMAN: Gunakan safe parsing untuk mencegah crash jika data kosong
      const safeParse = (key: string, fallback: any) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      };

      setMasteredKanji(safeParse("masteredKanji", []));
      setMasteredKotoba(safeParse("masteredKotoba", []));
      setUniqueKotobaAnswered(safeParse("uniqueKotobaAnswered", []));

      const savedProfile = safeParse("userProfile", null);
      if (savedProfile) {
        // Pastikan favoriteKanjiIds selalu array
        if (!Array.isArray(savedProfile.favoriteKanjiIds)) {
          savedProfile.favoriteKanjiIds = [];
        }
        setProfile(savedProfile);
        setEditForm(savedProfile);
      }

      setSurvivalHighScore(parseInt(localStorage.getItem("survivalHighScore") || "0", 10));
      setExamHighScore(parseInt(localStorage.getItem("examHighScore") || "0", 10));
      const time = localStorage.getItem("randomBestTime");
      if (time) setRandomBestTime(parseInt(time, 10));

      const kotobaStats = safeParse("kotobaExamStats", {});
      if (kotobaStats.unlocked) setUnlockedKotoba(kotobaStats.unlocked);

      const statsKanji = safeParse("kanjiAchievements", {});
      setKanjiStats(statsKanji);

      const ms = getMissionsState();
      if (ms) {
        setUserExp(ms.exp || 0);
        setSakuraCoins(ms.coins || 0);
      }
      
      const savedEq = safeParse("shopEquipped", {});
      setEquipped(savedEq);

      loadStreak();
      window.addEventListener("streakUpdated", loadStreak);

      // 🆕 Fetch Kanji dengan Loading State
      setIsLoadingKanji(true);
      fetch("/api/categories/semua/kanji")
        .then(res => res.json())
        .then(data => {
          setKanjiList(data);
          setIsLoadingKanji(false);
        })
        .catch(() => setIsLoadingKanji(false));

      fetch("/api/kotoba/semua").then(res => res.json()).then(data => setKotobaList(data)).catch(() => {});

      // Ambil Daftar Teman (Hanya yang accepted)
      const fetchFriends = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: friendsData } = await supabase
          .from('friends')
          .select('user_id, friend_id')
          .eq('status', 'accepted')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (friendsData && friendsData.length > 0) {
          const friendIds = friendsData.map(f => f.user_id === user.id ? f.friend_id : f.user_id);
          const uniqueFriendIds = Array.from(new Set(friendIds));

          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, total_exp')
            .in('id', uniqueFriendIds);
            
          if (profilesData) setFriendsList(profilesData);
        }
      };
      fetchFriends();
        
    } catch (e) {
      console.error("Error loading profile data:", e);
      setIsLoadingKanji(false);
    }

    return () => {
      window.removeEventListener("streakUpdated", loadStreak);
    }
  }, []);

  const saveProfile = () => {
    setProfile(editForm);
    localStorage.setItem("userProfile", JSON.stringify(editForm));
    setIsEditing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm({ ...editForm, avatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const toggleFavorite = (id: number) => {
    const current = editForm.favoriteKanjiIds || [];
    if (current.includes(id)) {
      setEditForm({ ...editForm, favoriteKanjiIds: current.filter(k => k !== id) });
    } else {
      if (current.length >= 4) return alert("Maksimal 4 kanji favorit!");
      setEditForm({ ...editForm, favoriteKanjiIds: [...current, id] });
    }
  };

  const totalKanji = 486;
  const totalKotoba = 500;
  const kanjiPercent = ((masteredKanji.length / totalKanji) * 100).toFixed(1);
  const kotobaPercent = ((masteredKotoba.length / totalKotoba) * 100).toFixed(1);
  
  const title = getTitle(masteredKanji.length);
  const favoriteData = (profile.favoriteKanjiIds || []).map(id => kanjiList.find(k => k.id === id)).filter(Boolean);
  
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const getKotobaProgress = (ach: any) => {
    if (ach.type === "category") {
      const kotobaInCat = kotobaList.filter(k => k.category === ach.categoryTarget);
      const masteredInCat = kotobaInCat.filter(k => uniqueKotobaAnswered.includes(k.id)).length;
      const percent = ach.targetCount ? (masteredInCat / ach.targetCount) * 100 : 0;
      return { current: masteredInCat, target: ach.targetCount, percent: Math.min(percent, 100) };
    } else {
      const isUnlocked = unlockedKotoba.includes(ach.id);
      return { current: isUnlocked ? 1 : 0, target: 1, percent: isUnlocked ? 100 : 0 };
    }
  };

  const getKanjiProgress = (ach: any) => {
    const unlockedList = kanjiStats.unlocked || [];
    if (ach.type === "category") {
      const kanjiInCat = kanjiList.filter((k: any) => k.category?.slug === ach.categoryTarget);
      const masteredInCat = kanjiInCat.filter((k: any) => masteredKanji.includes(k.id)).length;
      const percent = ach.targetCount ? (masteredInCat / ach.targetCount) * 100 : 0;
      return { current: masteredInCat, target: ach.targetCount, percent: Math.min(percent, 100) };
    } else if (ach.type === "progress") {
      const percent = (masteredKanji.length / ach.targetCount) * 100;
      return { current: masteredKanji.length, target: ach.targetCount, percent: Math.min(percent, 100) };
    } else {
      const isUnlocked = unlockedList.includes(ach.id);
      return { current: isUnlocked ? 1 : 0, target: 1, percent: isUnlocked ? 100 : 0 };
    }
  };

  const totalUnlockedKanji = ACHIEVEMENTS_KANJI.filter(ach => getKanjiProgress(ach).percent === 100).length;
  const totalUnlockedKotoba = ACHIEVEMENTS_KOTOBA.filter(ach => getKotobaProgress(ach).percent === 100).length;
  const topKotobaAch = ACHIEVEMENTS_KOTOBA.filter(a => a.type === "category").slice(0, 3);
  const topKanjiAch = ACHIEVEMENTS_KANJI.filter(a => a.type === "progress").slice(0, 3);

  const themeClass = equipped?.theme === "theme_moonlight" 
    ? "bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900" 
    : `bg-gradient-to-r ${title.color}`;

  const frameClass = equipped?.frame === "frame_azure" 
    ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]" 
    : equipped?.frame === "frame_emerald" 
    ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]" 
    : "border-white bg-slate-100";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        
        {/* Card Profil Utama */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          
          <div className={`h-48 relative transition-all duration-700 ${themeClass}`}>
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/80 hover:bg-white text-slate-800 px-4 py-2 rounded-xl backdrop-blur-md transition font-semibold text-sm shadow-sm"
              >
                {isEditing ? "Batal Edit" : "✏️ Edit Profil"}
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-8 pb-8 relative flex flex-col items-center">
            <div className="absolute -top-20 flex justify-center w-full left-0">
              <div className={`w-32 h-32 rounded-full border-4 overflow-hidden shadow-xl relative group transition-all duration-300 ${frameClass}`}>
                {editForm.avatar ? (
                  <img src={editForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl text-slate-400">👤</div>
                )}
                {isEditing && (
                  <label className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer text-white text-xs font-bold">
                    📷 Ubah
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                )}
              </div>
            </div>

            <div className="mt-16 text-center w-full">
              <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-800">{profile.name}</h1>
                {equipped?.title === "title_scholar" && (
                  <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded-full shadow-sm">
                    👑 The Scholar
                  </span>
                )}
              </div>
              
              <p className="text-sm text-slate-500 mb-3">Terakhir aktif: {streak?.lastActiveDate || "Belum pernah"}</p>
              
              <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 mb-4 shadow-sm">
                <span>{title.emoji}</span>
                <span>{title.name} <span className="text-slate-400 font-normal">• {title.subtitle}</span></span>
              </div>

              {isEditing ? (
                <div className="mt-4 space-y-4 max-w-lg mx-auto bg-slate-50 p-5 rounded-xl border border-slate-200 text-left">
                  <div>
                    <label className="text-sm font-bold text-slate-600">Nama</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg p-2 mt-1 text-slate-800 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600">Bio</label>
                    <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg p-2 mt-1 resize-none text-slate-800 focus:border-blue-500 outline-none" rows={2} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">Pilih 4 Kanji Favorit</label>
                    {/* 🆕 TAMPILKAN LOADING JIKA KANJI BELUM SIAP */}
                    {isLoadingKanji ? (
                      <div className="text-center py-4 text-slate-400 animate-pulse text-sm">Memuat daftar kanji...</div>
                    ) : kanjiList.length === 0 ? (
                      <div className="text-center py-4 text-red-400 text-sm">Gagal memuat kanji. Coba refresh.</div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto bg-white border border-slate-300 rounded-lg p-2 grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {kanjiList.map(k => (
                          <button key={k.id} onClick={() => toggleFavorite(k.id)} className={`p-2 text-xl font-bold rounded-lg border ${(editForm.favoriteKanjiIds || []).includes(k.id) ? "border-blue-500 bg-blue-50 text-blue-600" : "border-slate-200 hover:bg-slate-100 text-slate-600"}`}>
                            {k.character}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={saveProfile} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg shadow transition w-full">💾 Simpan Profil</button>
                </div>
              ) : (
                <>
                  <p className="text-slate-600 max-w-lg mx-auto mb-4">{profile.bio}</p>
                  
                  <div className="max-w-sm mx-auto bg-slate-50 rounded-xl p-3 border border-slate-200 mb-6">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>EXP: {userExp}</span>
                      <span>Next Level</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-500" style={{ width: `${(userExp % 100)}%` }} />
                    </div>
                  </div>

                  {/* 🆕 TOMBOL AKSI (GANTI PASSWORD & LOGOUT) */}
                  <div className="flex items-center justify-center gap-4 sm:gap-6">
                    <button 
                      onClick={() => window.location.href = '/update-password'} 
                      className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      🔑 Ganti Password
                    </button>
                    <span className="text-slate-300">|</span>
                    <button 
                      onClick={handleLogout} 
                      className="text-sm text-red-500 font-bold hover:underline flex items-center gap-1"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Statistik Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-4 shadow-sm">
            <div className="text-2xl sm:text-3xl">🔥</div>
            <div>
              <div className="font-bold text-slate-800 text-lg sm:text-xl">{streak?.currentStreak || 0}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold">Runtunan hari</div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-4 shadow-sm">
            <div className="text-2xl sm:text-3xl">⚡</div>
            <div>
              <div className="font-bold text-slate-800 text-lg sm:text-xl">{userExp}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold">Total XP</div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-4 shadow-sm">
            <div className="text-2xl sm:text-3xl">🌸</div>
            <div>
              <div className="font-bold text-slate-800 text-lg sm:text-xl">{sakuraCoins}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold">Koin Sakura</div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-4 shadow-sm">
            <div className="text-2xl sm:text-3xl">🏆</div>
            <div>
              <div className="font-bold text-slate-800 text-lg sm:text-xl">{totalUnlockedKanji + totalUnlockedKotoba}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold">Total Lencana</div>
            </div>
          </div>
        </div>

        {/* Progress Hafalan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-emerald-500">Kanji Dihafal</h2>
                <p className="text-slate-500 text-xs sm:text-sm">{masteredKanji.length} / {totalKanji}</p>
              </div>
              <span className="text-lg sm:text-xl font-bold text-emerald-500">{kanjiPercent}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000" style={{ width: `${kanjiPercent}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-blue-500">Kotoba Dihafal</h2>
                <p className="text-slate-500 text-xs sm:text-sm">{masteredKotoba.length} / {totalKotoba}</p>
              </div>
              <span className="text-lg sm:text-xl font-bold text-blue-500">{kotobaPercent}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-1000" style={{ width: `${kotobaPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Kartu Daily Streak Dinamis */}
        {streak && (() => {
          const days = streak.currentStreak || 0;
          
          let tierClass = "from-gray-400 to-slate-500";
          let fireClass = "fire-dead";
          let textDesc = "Ayo mulai belajar untuk menyalakan api!";
          let shadowClass = "shadow-sm";

          if (days >= 7) {
            tierClass = "from-red-500 via-orange-400 to-yellow-400";
            fireClass = "fire-high";
            textDesc = "Luar biasa! Kamu sedang membara! 🔥";
            shadowClass = "shadow-[0_0_30px_rgba(239,68,68,0.3)]";
          } else if (days >= 4) {
            tierClass = "from-orange-400 to-red-500";
            fireClass = "fire-medium";
            textDesc = "Api kamu menyala terang. Pertahankan!";
            shadowClass = "shadow-[0_0_20px_rgba(249,115,22,0.2)]";
          } else if (days >= 1) {
            tierClass = "from-yellow-400 to-orange-500";
            fireClass = "fire-low";
            textDesc = "Api kecil telah menyala. Jangan padamkan!";
          }

          return (
            <div className={`bg-gradient-to-br ${tierClass} ${shadowClass} rounded-2xl p-4 sm:p-6 border-2 border-white/50 transition-all duration-500 mb-8 flex flex-col sm:flex-row items-center sm:items-start sm:justify-between text-white gap-4`}>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="text-4xl sm:text-5xl bg-white/20 p-3 rounded-xl shadow-inner backdrop-blur-sm">
                  <span className={`inline-block transition-all duration-500 ${fireClass}`}>
                    🔥
                  </span>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">Daily Streak</h2>
                  <p className="text-xs sm:text-sm text-white/90 font-medium">{textDesc}</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-3xl sm:text-4xl font-black">{days} Hari</div>
                <div className="text-[10px] sm:text-xs text-white/80 font-bold">Terpanjang: {streak.longestStreak || 0} Hari</div>
              </div>
            </div>
          );
        })()}

        {/* Statistik Rekor */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">🏆 Pencapaian Rekor</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm text-center sm:text-left">
            <div className="text-2xl sm:text-3xl mb-2">⚔️</div>
            <div className="text-xs sm:text-sm text-slate-500 font-semibold">Skor Survival</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800">{survivalHighScore} <span className="text-xs sm:text-sm font-normal text-slate-400">kanji</span></div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm text-center sm:text-left">
            <div className="text-2xl sm:text-3xl mb-2">📝</div>
            <div className="text-xs sm:text-sm text-slate-500 font-semibold">Skor Ujian Kanji</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800">{examHighScore} <span className="text-xs sm:text-sm font-normal text-slate-400">/ 50</span></div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm text-center sm:text-left">
            <div className="text-2xl sm:text-3xl mb-2">⚡</div>
            <div className="text-xs sm:text-sm text-slate-500 font-semibold">Waktu Tercepat (Acak)</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800">
              {randomBestTime ? formatTime(randomBestTime) : "-"}
            </div>
          </div>
        </div>

        {/* Kanji Favorit */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">🌸 4 Kanji Favorit</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {favoriteData.length > 0 ? (
            favoriteData.map((k: any) => (
              <div key={k.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 text-center shadow-sm relative overflow-hidden group">
                <div className="absolute top-2 right-2 text-3xl sm:text-4xl opacity-10 group-hover:scale-110 transition">🎌</div>
                <div className="text-4xl sm:text-6xl font-bold mb-2 sm:mb-3 drop-shadow-sm text-slate-800">{k.character}</div>
                <div className="font-bold text-blue-500 text-sm sm:text-base">{k.hiragana}</div>
                <div className="text-xs sm:text-sm text-slate-500">{k.meaning}</div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-sm">
              Belum ada kanji favorit. Klik "Edit Profil" untuk memilih.
            </div>
          )}
        </div>

        {/* Daftar Teman */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">👥 Daftar Teman ({friendsList.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {friendsList.length > 0 ? (
            friendsList.map((friend) => (
              <Link href={`/user/${friend.id}`} key={friend.id} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition group">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border-2 border-white shadow-inner flex items-center justify-center text-xl font-bold text-emerald-500 overflow-hidden mb-2">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    friend.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition">
                  {friend.username}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Lv. {Math.floor(Math.sqrt((friend.total_exp || 0) / 50)) + 1}
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-sm">
              Belum ada teman. Yuk cari teman baru!
            </div>
          )}
        </div>

        {/* ===== ACHIEVEMENT KOTOBA ===== */}
        <div className="mt-8 sm:mt-12 mb-10">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-slate-800">
              🏅 Pencapaian Kotoba
              <span className="text-xs sm:text-sm font-normal text-slate-400">({totalUnlockedKotoba} / {ACHIEVEMENTS_KOTOBA.length})</span>
            </h2>
            <Link href="/profil/achievements" className="text-xs sm:text-sm font-bold text-blue-500 hover:text-blue-600 transition flex items-center gap-1 bg-blue-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-blue-100">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {topKotobaAch.map((ach) => {
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
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mb-2">{ach.desc}</p>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                      <div className={`h-full ${isUnlocked ? "bg-yellow-400" : "bg-slate-300"}`} style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{current} dari {target} kotoba berhasil dijawab benar.</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== ACHIEVEMENT KANJI ===== */}
        <div className="mt-8 sm:mt-12 mb-10">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-slate-800">
              🏅 Pencapaian Kanji
              <span className="text-xs sm:text-sm font-normal text-slate-400">({totalUnlockedKanji} / {ACHIEVEMENTS_KANJI.length})</span>
            </h2>
            <Link href="/profil/achievements-kanji" className="text-xs sm:text-sm font-bold text-blue-500 hover:text-blue-600 transition flex items-center gap-1 bg-blue-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-blue-100">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {topKanjiAch.map((ach) => {
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
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mb-2">{ach.desc}</p>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
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