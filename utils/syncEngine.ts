// utils/syncEngine.ts
import { supabase } from "./supabase";

export async function syncDataToDatabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // === 1. AMBIL DATA DARI DATABASE ===
    const { data: dbProfile } = await supabase
      .from('profiles')
      .select('total_exp, sakura_coins, current_streak, longest_streak')
      .eq('id', user.id)
      .single();

    // === 2. AMBIL DATA DARI LOCALSTORAGE ===
    const localMasteredKanji = JSON.parse(localStorage.getItem("masteredKanji") || "[]");
    const localMasteredKotoba = JSON.parse(localStorage.getItem("masteredKotoba") || "[]");
    const uniqueKotoba = JSON.parse(localStorage.getItem("uniqueKotobaAnswered") || "[]");
    const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    const missions = JSON.parse(localStorage.getItem("kanjiMaster.missions.v1") || "{}");
    const streak = JSON.parse(localStorage.getItem("kanjiMaster.streak.v1") || "{}");
    
    // === 3. TENTUKAN DATA FINAL (Local vs DB) ===
    const finalExp = Math.max(dbProfile?.total_exp || 0, missions.exp || 0);
    const finalCoins = Math.max(dbProfile?.sakura_coins || 0, missions.coins || 0);
    const finalStreak = Math.max(dbProfile?.current_streak || 0, streak.currentStreak || 0);

    // === 4. UPDATE PROFIL DI DATABASE ===
    await supabase.from('profiles').update({
      total_exp: finalExp,
      sakura_coins: finalCoins,
      current_streak: finalStreak,
      longest_streak: Math.max(dbProfile?.longest_streak || 0, streak.longestStreak || 0),
      avatar_url: userProfile.avatar || null,
      username: userProfile.name || undefined,
      bio: userProfile.bio || undefined,
    }).eq('id', user.id);

    // === 5. UPDATE LOCALSTORAGE DENGAN DATA DARI DB (jika DB lebih tinggi) ===
    if (dbProfile) {
      const updatedMissions = {
        ...missions,
        exp: Math.max(missions.exp || 0, dbProfile.total_exp),
        coins: Math.max(missions.coins || 0, dbProfile.sakura_coins),
      };
      localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(updatedMissions));

      const updatedStreak = {
        ...streak,
        currentStreak: Math.max(streak.currentStreak || 0, dbProfile.current_streak),
        longestStreak: Math.max(streak.longestStreak || 0, dbProfile.longest_streak),
      };
      localStorage.setItem("kanjiMaster.streak.v1", JSON.stringify(updatedStreak));
    }

    // === 6. SINKRONISASI HAFALAN ===
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

    // === 7. UPDATE LOCALSTORAGE DENGAN DATA DARI DB ===
    const allKanjiFromDB = Array.from(new Set([...existingKanji, ...newKanji]));
    const allKotobaFromDB = Array.from(new Set([...existingKotoba, ...newKotoba]));
    localStorage.setItem("masteredKanji", JSON.stringify(allKanjiFromDB));
    localStorage.setItem("masteredKotoba", JSON.stringify(allKotobaFromDB));

    // === 8. SINKRONISASI ACHIEVEMENT ===
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

    // Dispatch event agar UI update
    window.dispatchEvent(new Event("missionUpdated"));
    window.dispatchEvent(new Event("streakUpdated"));

  } catch (err) {
    console.error("Sync error:", err);
  }
}