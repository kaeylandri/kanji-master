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

  const claimGifts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return; 
    // ... (kode claimGifts kamu tetap sama)
  };

  useEffect(() => {
    // 🆕 PENGAMAN TIMEOUT: Jika dalam 2.5 detik tidak ada respon, matikan loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    const checkAuth = async () => {
      try {
        // Beri jeda sedikit agar Supabase selesai memproses token dari URL
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        const isAuthPage = 
          pathname === "/login" || 
          pathname === "/register" || 
          pathname === "/forgot-password" || 
          pathname === "/update-password";

        const isValidUser = session && session.user && session.user.email;

        if (!isValidUser && !isAuthPage) {
          // Jika tidak ada user valid, paksa bersihkan sesi dan lempar ke login
          await supabase.auth.signOut();
          router.push("/login");
          return; 
        }

        if (isValidUser && isAuthPage && pathname !== "/update-password") {
          router.push("/");
          return;
        }

        if (isValidUser) {
          try {
            checkStreakExpiry();
            await syncDataToDatabase(); 
            claimGifts();
          } catch (err) {
            console.error("Auth initialization error:", err);
          }
        }

        setIsLoading(false);
        clearTimeout(timeoutId); // Hentikan timer jika berhasil
      } catch (err) {
        console.error("Check Auth Error:", err);
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
        setIsLoading(false);
      }
      
      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
        if (pathname === "/update-password") {
          setIsLoading(false);
        } else if (session?.user?.email) {
          checkStreakExpiry();
          await syncDataToDatabase();
          claimGifts();
          setIsLoading(false);
        }
      }
    });

    return () => {
      clearTimeout(timeoutId);
      authListener.subscription.unsubscribe();
    };
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