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

    if (dbError || !dbProfile) return;

    // 🆕 DETEKSI AKUN BARU: Cek apakah profil di DB benar-benar kosong
    const isNewAccountInDB = 
      (dbProfile.total_exp || 0) === 0 && 
      (dbProfile.sakura_coins || 0) === 0 && 
      (dbProfile.mastered_kanji_count || 0) === 0;

    // Cek apakah ada data lokal yang mencurigakan
    const localMasteredKanjiRaw = localStorage.getItem("masteredKanji");
    const localMasteredKanji = localMasteredKanjiRaw ? JSON.parse(localMasteredKanjiRaw) : [];
    const hasStaleLocalData = localMasteredKanji.length > 0;

    // 🆕 JIKA INI AKUN BARU TAPI LOKAL ADA DATA, HAPUS TOTAL SEMUA DATA LOKAL
    if (isNewAccountInDB && hasStaleLocalData) {
      console.log("🚨 Akun baru terdeteksi dengan data lokal sisa. Menghapus semua data lokal...");
      
      // Hapus SEMUA key yang berkaitan dengan game
      const keysToDelete = [
        "masteredKanji", "masteredKotoba", "uniqueKotobaAnswered",
        "kanjiMaster.missions.v1", "kanjiMaster.streak.v1",
        "userProfile", "kanjiAchievements", "kotobaExamStats",
        "survivalHighScore", "examHighScore", "randomBestTime",
        "shopEquipped", "shopInventory", "kanjiMaster.inventory.v1",
        "last_fire_time", "last_fire_date", "last_achievement_time"
      ];
      
      keysToDelete.forEach(key => localStorage.removeItem(key));
      
      // Hapus semua penanda achievement permanen
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("achievement_shown_permanent_")) {
          localStorage.removeItem(key);
        }
      });

      // Paksa reload untuk memastikan UI bersih
      window.location.reload();
      return;
    }

    // --- SISA LOGIKA SINKRONISASI NORMAL ---
    
    // 2. Ambil data dari LocalStorage
    const localProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    const localMissions = JSON.parse(localStorage.getItem("kanjiMaster.missions.v1") || "{}");
    const localStreak = JSON.parse(localStorage.getItem("kanjiMaster.streak.v1") || "{}");

    // 3. Tentukan Data Final
    const finalExp = Math.max(dbProfile.total_exp || 0, localMissions.exp || 0);
    const finalCoins = Math.max(dbProfile.sakura_coins || 0, localMissions.coins || 0);
    const finalStreak = Math.max(dbProfile.current_streak || 0, localStreak.currentStreak || 0);
    const finalLongestStreak = Math.max(dbProfile.longest_streak || 0, localStreak.longestStreak || 0);

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
    }).eq('id', user.id);

    // 5. Sinkronkan ke LocalStorage
    const updatedMissions = { ...localMissions, exp: finalExp, coins: finalCoins };
    localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(updatedMissions));

    const updatedProfile = {
      ...localProfile,
      name: finalUsername,
      avatar: finalAvatar,
      bio: finalBio,
      favoriteKanjiIds: finalFavorites,
    };
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));

    // 6. Sinkronisasi Hafalan
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

    const progressData: any[] = [];
    newKanji.forEach((id: number) => {
      progressData.push({ user_id: user.id, item_type: 'kanji', item_id: id, is_mastered: true });
    });
    newKotoba.forEach((id: number) => {
      progressData.push({ user_id: user.id, item_type: 'kotoba', item_id: id, is_mastered: true });
    });

    if (progressData.length > 0) {
      await supabase.from('user_progress').upsert(progressData, { onConflict: 'user_id,item_type,item_id' });
    }

    const allKanjiFromDB = Array.from(new Set([...existingKanji, ...newKanji]));
    const allKotobaFromDB = Array.from(new Set([...existingKotoba, ...newKotoba]));
    localStorage.setItem("masteredKanji", JSON.stringify(allKanjiFromDB));
    localStorage.setItem("masteredKotoba", JSON.stringify(allKotobaFromDB));

    // 7. Sinkronisasi Achievement
    const { data: dbAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const dbUnlockedIds = (dbAchievements || []).map(a => a.achievement_id);

    const kanjiStats = JSON.parse(localStorage.getItem("kanjiAchievements") || "{}");
    const kotobaStats = JSON.parse(localStorage.getItem("kotobaExamStats") || "{}");
    const localUnlockedKanji = kanjiStats.unlocked || [];
    const localUnlockedKotoba = kotobaStats.unlocked || [];

    // Jika DB kosong, paksa local kosong juga
    const finalUnlockedKanji = dbUnlockedIds.length === 0 ? [] : Array.from(new Set([...localUnlockedKanji, ...dbUnlockedIds]));
    const finalUnlockedKotoba = dbUnlockedIds.length === 0 ? [] : Array.from(new Set([...localUnlockedKotoba, ...dbUnlockedIds]));

    localStorage.setItem("kanjiAchievements", JSON.stringify({ ...kanjiStats, unlocked: finalUnlockedKanji }));
    localStorage.setItem("kotobaExamStats", JSON.stringify({ ...kotobaStats, unlocked: finalUnlockedKotoba }));

    window.dispatchEvent(new Event("missionUpdated"));
    window.dispatchEvent(new Event("streakUpdated"));
    
  } catch (err) {
    console.error("Sync error:", err);
  }
}