// components/AuthGuard.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { syncDataToDatabase } from "@/utils/syncEngine";
import { checkStreakExpiry, getInventory } from "@/utils/luckyEngine";
import { getMissionsState } from "@/utils/missionEngine";
import { triggerToast } from "@/utils/toast";

function AuthGuardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk menjemput hadiah dari teman
  const claimGifts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: gifts } = await supabase
      .from('gifts')
      .select('*')
      .eq('receiver_id', user.id)
      .eq('is_claimed', false);

    if (gifts && gifts.length > 0) {
      let totalCoins = 0;
      let totalFreeze = 0;

      for (const gift of gifts) {
        if (gift.item_type === 'coins') totalCoins += gift.amount;
        if (gift.item_type === 'freeze') totalFreeze += gift.amount;
        await supabase.from('gifts').update({ is_claimed: true }).eq('id', gift.id);
      }

      if (totalCoins > 0) {
        const ms = getMissionsState();
        if (ms) {
          ms.coins += totalCoins;
          localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(ms));
          window.dispatchEvent(new Event("missionUpdated"));
        }
      }
      if (totalFreeze > 0) {
        const inv = getInventory();
        if (inv) {
          inv.freeze += totalFreeze;
          localStorage.setItem("kanjiMaster.inventory.v1", JSON.stringify(inv));
          window.dispatchEvent(new Event("inventoryUpdated"));
        }
      }

      triggerToast(`Kamu menerima hadiah: 🌸 ${totalCoins} Koin & ❄️ ${totalFreeze} Freeze!`, "success");
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      // 🆕 Beri jeda sedikit agar Supabase sempat membaca token dari URL email
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const isAuthPage = 
        pathname === "/login" || 
        pathname === "/register" || 
        pathname === "/forgot-password" || 
        pathname === "/update-password";

      // 🆕 LOGIKA BARU YANG LEBIH AMAN
      if (!session && !isAuthPage) {
        // Belum login & bukan halaman publik -> Lempar ke login
        router.push("/login");
        // Jangan setIsLoading(false) di sini agar tidak flash konten sebelum redirect
      } else if (session && isAuthPage && pathname !== "/update-password") {
        // Sudah login tapi buka halaman login/register -> Lempar ke dashboard
        router.push("/");
      } else {
        // Jika ada session ATAU sedang di halaman update-password, matikan loading
        if (session) {
          checkStreakExpiry();
          syncDataToDatabase();
          claimGifts();
        }
        setIsLoading(false); // 🆕 Pastikan ini terpanggil!
      }
    };

    checkAuth();

    // 🆕 Dengarkan perubahan status (termasuk saat token reset password diproses)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      }
      
      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
        // Jika di halaman update-password, cukup matikan loading
        if (pathname === "/update-password") {
          setIsLoading(false);
        } else {
          // Jika di halaman lain, jalankan sinkronisasi
          checkStreakExpiry();
          syncDataToDatabase();
          claimGifts();
          setIsLoading(false);
        }
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-6xl mb-4 animate-bounce">🎌</div>
        <div className="text-slate-500 font-bold animate-pulse text-lg">Memeriksa keamanan...</div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-6xl mb-4 animate-bounce">🎌</div>
        <div className="text-slate-500 font-bold animate-pulse text-lg">Memuat...</div>
      </div>
    }>
      <AuthGuardContent>{children}</AuthGuardContent>
    </Suspense>
  );
}