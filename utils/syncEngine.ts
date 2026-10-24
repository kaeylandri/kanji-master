// utils/syncEngine.ts
import { supabase } from "./supabase";

export async function syncDataToDatabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // === 1. AMBIL DATA DARI DATABASE ===
    const { data: dbProfile, error: dbError } = await supabase
      .from('profiles')
      .select('total_exp, sakura_coins, current_streak, longest_streak, username, avatar_url, bio')
      .eq('id', user.id)
      .single();

    if (dbError || !dbProfile) {
      console.error("Gagal mengambil profil dari DB:", dbError);
      return;
    }

    // === 2. AMBIL DATA DARI LOCALSTORAGE ===
    const localMasteredKanji = JSON.parse(localStorage.getItem("masteredKanji") || "[]");
    const localMasteredKotoba = JSON.parse(localStorage.getItem("masteredKotoba") || "[]");
    const uniqueKotoba = JSON.parse(localStorage.getItem("uniqueKotobaAnswered") || "[]");
    
    // 🆕 Ambil userProfile lengkap (termasuk favoriteKanjiIds)
    const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    const missions = JSON.parse(localStorage.getItem("kanjiMaster.missions.v1") || "{}");
    const streak = JSON.parse(localStorage.getItem("kanjiMaster.streak.v1") || "{}");

    // === 3. TENTUKAN DATA FINAL ===
    const finalExp = Math.max(dbProfile.total_exp || 0, missions.exp || 0);
    const finalCoins = Math.max(dbProfile.sakura_coins || 0, missions.coins || 0);
    const finalStreak = Math.max(dbProfile.current_streak || 0, streak.currentStreak || 0);
    const finalLongestStreak = Math.max(dbProfile.longest_streak || 0, streak.longestStreak || 0);

    // 🆕 LOGIKA AVATAR & PROFIL
    const finalUsername = userProfile.name || dbProfile.username;
    const finalAvatar = userProfile.avatar || dbProfile.avatar_url; // Ambil dari DB jika local kosong
    const finalBio = userProfile.bio !== undefined && userProfile.bio !== "" ? userProfile.bio : dbProfile.bio;
    const finalFavorites = userProfile.favoriteKanjiIds || []; // Simpan favorit

    // === 4. UPDATE PROFIL DI DATABASE (Hanya data yang aman) ===
    await supabase.from('profiles').update({
      total_exp: finalExp,
      sakura_coins: finalCoins,
      current_streak: finalStreak,
      longest_streak: finalLongestStreak,
      username: finalUsername,
      avatar_url: finalAvatar,
      bio: finalBio,
    }).eq('id', user.id);

    // === 5. PAKSA LOCALSTORAGE MENGGUNAKAN DATA FINAL ===
    const updatedMissions = {
      ...missions,
      exp: finalExp,
      coins: finalCoins,
    };
    localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(updatedMissions));

    const updatedStreak = {
      ...streak,
      currentStreak: finalStreak,
      longestStreak: finalLongestStreak,
    };
    localStorage.setItem("kanjiMaster.streak.v1", JSON.stringify(updatedStreak));

    // 🆕 SIMPAN KEMBALI PROFIL LENGKAP (Agar PP dan Kanji Fav muncul)
    const updatedProfile = {
      ...userProfile,
      name: finalUsername,
      avatar: finalAvatar,
      bio: finalBio,
      favoriteKanjiIds: finalFavorites, 
    };
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));

    // === 6. SINKRONISASI HAFALAN (Sama seperti sebelumnya) ===
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('item_type, item_id')
      .eq('user_id', user.id);

    const existingKanji = new Set((existingProgress || []).filter(p => p.item_type === 'kanji').map(p => p.item_id));
    const existingKotoba = new Set((existingProgress || []).filter(p => p.item_type === 'kotoba').map(p => p.item_id));

    const newKanji = localMasteredKanji.filter((id: number) => !existingKanji.has(id));
    const newKotoba = localMasteredKotoba.filter((id: number) => !existingKotoba.has(id));
    const newUniqueKotoba = uniqueKotoba.filter((id: number) => !existingKotoba.has(id));

    const progressData: any[] = [];
    newKanji.forEach((id: number) => {
      progressData.push({ user_id: user.id, item_type: 'kanji', item_id: id, is_mastered: true });
    });
    newUniqueKotoba.forEach((id: number) => {
      progressData.push({ user_id: user.id, item_type: 'kotoba', item_id: id, is_mastered: newKotoba.includes(id) });
    });

    if (progressData.length > 0) {
      await supabase.from('user_progress').upsert(progressData, { onConflict: 'user_id,item_type,item_id' });
    }

    const allKanjiFromDB = Array.from(new Set([...existingKanji, ...newKanji]));
    const allKotobaFromDB = Array.from(new Set([...existingKotoba, ...newKotoba]));
    localStorage.setItem("masteredKanji", JSON.stringify(allKanjiFromDB));
    localStorage.setItem("masteredKotoba", JSON.stringify(allKotobaFromDB));

    // === 7. SINKRONISASI ACHIEVEMENT ===
    const kanjiStats = JSON.parse(localStorage.getItem("kanjiAchievements") || "{}");
    const kotobaStats = JSON.parse(localStorage.getItem("kotobaExamStats") || "{}");
    const allUnlocked = Array.from(new Set([...(kanjiStats.unlocked || []), ...(kotobaStats.unlocked || [])]));

    await supabase.from('user_achievements').delete().eq('user_id', user.id);
    if (allUnlocked.length > 0) {
      const achData = allUnlocked.map((achId: string) => ({
        user_id: user.id,
        achievement_id: achId
      }));
      await supabase.from('user_achievements').insert(achData);
    }

    // Picu event agar UI langsung berubah tanpa reload
    window.dispatchEvent(new Event("missionUpdated"));
    window.dispatchEvent(new Event("streakUpdated"));
    
  } catch (err) {
    console.error("Sync error:", err);
  }
}