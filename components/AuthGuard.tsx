// components/AuthGuard.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { syncDataToDatabase } from "@/utils/syncEngine";
import { checkStreakExpiry } from "@/utils/luckyEngine";
import { getMissionsState } from "@/utils/missionEngine"; // 🆕
import { getInventory } from "@/utils/luckyEngine"; // 🆕
import { triggerToast } from "@/utils/toast"; // 🆕

// Pisahkan logika ke komponen internal
function AuthGuardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  // 🆕 Fungsi untuk menjemput hadiah dari teman
  const claimGifts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Ambil semua hadiah yang belum diklaim
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

        // Tandai sudah diklaim
        await supabase.from('gifts').update({ is_claimed: true }).eq('id', gift.id);
      }

      // Masukkan ke localStorage
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
      const { data: { session } } = await supabase.auth.getSession();
      
      // Tambahkan forgot-password dan update-password sebagai halaman publik
      const isAuthPage = 
        pathname === "/login" || 
        pathname === "/register" || 
        pathname === "/forgot-password" || 
        pathname === "/update-password";

      if (!session && !isAuthPage) {
        // Jika belum login dan bukan di halaman publik, lempar ke login
        router.push("/login");
      } else if (session && isAuthPage) {
        // Jika sudah login tapi mencoba buka halaman login/register, lempar ke dashboard
        // (Kecuali update-password, karena user yang login mungkin ingin ganti password)
        if (pathname !== "/update-password") {
          router.push("/");
        }
      } else {
        if (session) {
          checkStreakExpiry();
          syncDataToDatabase();
          claimGifts(); // 🆕 Panggil fungsi klaim hadiah
        }
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") router.push("/login");
      if (event === "SIGNED_IN") {
        checkStreakExpiry();
        syncDataToDatabase();
        claimGifts(); // 🆕 Panggil juga saat login
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

// Bungkus dengan Suspense di komponen utama
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