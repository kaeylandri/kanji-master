// utils/syncEngine.ts
import { supabase } from "./supabase";

export async function syncDataToDatabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const localMasteredKanji = JSON.parse(localStorage.getItem("masteredKanji") || "[]");
    const localMasteredKotoba = JSON.parse(localStorage.getItem("masteredKotoba") || "[]");
    const uniqueKotoba = JSON.parse(localStorage.getItem("uniqueKotobaAnswered") || "[]");
    const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");

    // Ambil data achievement dari localStorage
    const kanjiStats = JSON.parse(localStorage.getItem("kanjiAchievements") || "{}");
    const kotobaStats = JSON.parse(localStorage.getItem("kotobaExamStats") || "{}");
    
    const unlockedKanji = kanjiStats.unlocked || [];
    const unlockedKotoba = kotobaStats.unlocked || [];
    const allUnlockedAchievements = Array.from(new Set([...unlockedKanji, ...unlockedKotoba]));

    // 1. Sinkronisasi Profil Utama
    const missions = JSON.parse(localStorage.getItem("kanjiMaster.missions.v1") || "{}");
    const streak = JSON.parse(localStorage.getItem("kanjiMaster.streak.v1") || "{}");
    
    await supabase.from('profiles').update({
      total_exp: missions.exp || 0,
      sakura_coins: missions.coins || 0,
      current_streak: streak.currentStreak || 0,
      longest_streak: streak.longestStreak || 0,
      avatar_url: userProfile.avatar || null,
      username: userProfile.name || undefined,
      bio: userProfile.bio || undefined,
    }).eq('id', user.id);

    // 2. Bersihkan & Simpan Progress Hafalan (Kanji & Kotoba)
    await supabase.from('user_progress').delete().eq('user_id', user.id);

    const progressData: any[] = [];
    localMasteredKanji.forEach((id: number) => {
      progressData.push({ user_id: user.id, item_type: 'kanji', item_id: id, is_mastered: true });
    });
    
    const allKotobaIds = Array.from(new Set([...localMasteredKotoba, ...uniqueKotoba]));
    allKotobaIds.forEach((id: number) => {
      progressData.push({ 
        user_id: user.id, 
        item_type: 'kotoba', 
        item_id: id, 
        is_mastered: localMasteredKotoba.includes(id) 
      });
    });

    if (progressData.length > 0) {
      await supabase.from('user_progress').insert(progressData);
    }

    // 🆕 3. Bersihkan & Simpan Achievement
    await supabase.from('user_achievements').delete().eq('user_id', user.id);

    if (allUnlockedAchievements.length > 0) {
      const achievementData = allUnlockedAchievements.map((achId: string) => ({
        user_id: user.id,
        achievement_id: achId
      }));
      await supabase.from('user_achievements').insert(achievementData);
    }

  } catch (err) {
    console.error("Sync error:", err);
  }
}