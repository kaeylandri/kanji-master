// utils/syncEngine.ts
import { supabase } from "./supabase";

export async function syncDataToDatabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // 1. Ambil data dari DB
    const { data: dbProfile, error: dbError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError || !dbProfile) {
      console.error("Gagal mengambil profil dari DB:", dbError);
      return;
    }

    // 2. Ambil data dari LocalStorage
    const localProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    const localMissions = JSON.parse(localStorage.getItem("kanjiMaster.missions.v1") || "{}");
    const localStreak = JSON.parse(localStorage.getItem("kanjiMaster.streak.v1") || "{}");
    const localSurvival = parseInt(localStorage.getItem("survivalHighScore") || "0", 10);
    const localExam = parseInt(localStorage.getItem("examHighScore") || "0", 10);
    const localRandomTime = parseInt(localStorage.getItem("randomBestTime") || "0", 10);

    // 3. Tentukan Data Final (Jangan pernah turunkan nilai)
    const finalExp = Math.max(dbProfile.total_exp || 0, localMissions.exp || 0);
    const finalCoins = Math.max(dbProfile.sakura_coins || 0, localMissions.coins || 0);
    const finalStreak = Math.max(dbProfile.current_streak || 0, localStreak.currentStreak || 0);
    const finalLongestStreak = Math.max(dbProfile.longest_streak || 0, localStreak.longestStreak || 0);
    
    // Rekor
    const finalSurvival = Math.max(dbProfile.survival_high_score || 0, localSurvival);
    const finalExam = Math.max(dbProfile.exam_high_score || 0, localExam);
    let finalRandomTime = dbProfile.random_best_time || 0;
    if (localRandomTime > 0) {
      finalRandomTime = finalRandomTime > 0 ? Math.min(finalRandomTime, localRandomTime) : localRandomTime;
    }

    // PROFIL: Jika local kosong, PASTI pakai punya DB
    const finalUsername = localProfile.name || dbProfile.username || "Pengguna";
    const finalAvatar = localProfile.avatar || dbProfile.avatar_url || "";
    const finalBio = localProfile.bio || dbProfile.bio || "";
    const finalFavorites = localProfile.favoriteKanjiIds || [];

    // 4. Update DB
    await supabase.from('profiles').update({
      total_exp: finalExp,
      sakura_coins: finalCoins,
      current_streak: finalStreak,
      longest_streak: finalLongestStreak,
      username: finalUsername,
      avatar_url: finalAvatar,
      bio: finalBio,
      survival_high_score: finalSurvival,
      exam_high_score: finalExam,
      random_best_time: finalRandomTime,
    }).eq('id', user.id);

    // 5. PAKSA LOCALSTORAGE MENGGUNAKAN DATA FINAL DARI DB
    const updatedMissions = { ...localMissions, exp: finalExp, coins: finalCoins };
    localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(updatedMissions));

    const updatedStreak = { ...localStreak, currentStreak: finalStreak, longestStreak: finalLongestStreak };
    localStorage.setItem("kanjiMaster.streak.v1", JSON.stringify(updatedStreak));

    localStorage.setItem("survivalHighScore", finalSurvival.toString());
    localStorage.setItem("examHighScore", finalExam.toString());
    if (finalRandomTime > 0) localStorage.setItem("randomBestTime", finalRandomTime.toString());

    const updatedProfile = {
      ...localProfile,
      name: finalUsername,
      avatar: finalAvatar,
      bio: finalBio,
      favoriteKanjiIds: finalFavorites, 
    };
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));

    // === 6. SINKRONISASI HAFALAN (KANJI & KOTOBA) ===
    const localMasteredKanji = JSON.parse(localStorage.getItem("masteredKanji") || "[]");
    const localMasteredKotoba = JSON.parse(localStorage.getItem("masteredKotoba") || "[]");
    const uniqueKotoba = JSON.parse(localStorage.getItem("uniqueKotobaAnswered") || "[]");

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

    // 🆕 GABUNGKAN data dari DB + Local
    const allKanjiFromDB = Array.from(new Set([...existingKanji, ...newKanji]));
    const allKotobaFromDB = Array.from(new Set([...existingKotoba, ...newKotoba]));
    localStorage.setItem("masteredKanji", JSON.stringify(allKanjiFromDB));
    localStorage.setItem("masteredKotoba", JSON.stringify(allKotobaFromDB));

    // === 7. SINKRONISASI ACHIEVEMENT ===
    // 🆕 Ambil achievement dari DB
    const { data: dbAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const dbUnlockedIds = (dbAchievements || []).map(a => a.achievement_id);

    // 🆕 Gabungkan dengan achievement lokal
    const kanjiStats = JSON.parse(localStorage.getItem("kanjiAchievements") || "{}");
    const kotobaStats = JSON.parse(localStorage.getItem("kotobaExamStats") || "{}");
    const localUnlockedKanji = kanjiStats.unlocked || [];
    const localUnlockedKotoba = kotobaStats.unlocked || [];

    const combinedUnlockedKanji = Array.from(new Set([...localUnlockedKanji, ...dbUnlockedIds]));
    const combinedUnlockedKotoba = Array.from(new Set([...localUnlockedKotoba, ...dbUnlockedIds]));

    // 🆕 Simpan ke localStorage agar checkAchievements tahu ini sudah unlock
    localStorage.setItem("kanjiAchievements", JSON.stringify({ 
      ...kanjiStats, 
      unlocked: combinedUnlockedKanji 
    }));

    localStorage.setItem("kotobaExamStats", JSON.stringify({ 
      ...kotobaStats, 
      unlocked: combinedUnlockedKotoba 
    }));

    // 🆕 Sinkronkan kembali ke DB (jika ada yang belum masuk)
    const newAchKanji = localUnlockedKanji.filter((id: string) => !dbUnlockedIds.includes(id));
    const newAchKotoba = localUnlockedKotoba.filter((id: string) => !dbUnlockedIds.includes(id));
    const allNewAch = Array.from(new Set([...newAchKanji, ...newAchKotoba]));

    if (allNewAch.length > 0) {
      const achData = allNewAch.map((achId: string) => ({
        user_id: user.id,
        achievement_id: achId
      }));
      // Gunakan upsert agar tidak error jika sudah ada
      await supabase.from('user_achievements').upsert(achData, { onConflict: 'user_id,achievement_id' });
    }

    // 8. Trigger Event
    window.dispatchEvent(new Event("missionUpdated"));
    window.dispatchEvent(new Event("streakUpdated"));
    
  } catch (err) {
    console.error("Sync error:", err);
  }
}