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
  
  // 🆕 State untuk memastikan pengecekan selesai sebelum render
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isAuthPage = 
    pathname === "/login" || 
    pathname === "/register" || 
    pathname === "/forgot-password" || 
    pathname === "/update-password";

  const claimGifts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return; 
    // ... (kode claimGifts kamu tetap sama)
  };

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        // 🆕 Beri jeda sedikit agar Supabase sempat membaca token dari URL email
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        const isValidUser = session && session.user && session.user.email;

        if (isValidUser) {
          setIsAuthenticated(true);
          
          // Jalankan sinkronisasi hanya jika bukan halaman auth
          if (!isAuthPage) {
            try {
              checkStreakExpiry();
              await syncDataToDatabase();
              claimGifts();
            } catch (err) {
              console.error("Auth initialization error:", err);
            }
          }
        } else {
          setIsAuthenticated(false);
          
          // 🆕 Redirect ke login jika bukan halaman publik
          if (!isAuthPage) {
            router.replace("/login");
          }
        }
      } catch (err) {
        console.error("Check Auth Error:", err);
        if (isMounted) {
          setIsAuthenticated(false);
          if (!isAuthPage) router.replace("/login");
        }
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        if (!isAuthPage) router.replace("/login");
        setIsChecking(false);
      }
      
      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
        setIsAuthenticated(true);
        
        if (pathname === "/update-password") {
          setIsChecking(false);
        } else if (session?.user?.email) {
          try {
            checkStreakExpiry();
            await syncDataToDatabase();
            claimGifts();
          } catch (err) {
            console.error("Sync on auth change error:", err);
          }
          setIsChecking(false);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [pathname, isAuthPage, router]);

  // 🆕 TAHAN RENDER SELAMA PENGECEKAN
  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-6xl mb-4 animate-bounce">🎌</div>
        <div className="text-slate-500 font-bold animate-pulse text-lg">Memeriksa keamanan...</div>
      </div>
    );
  }

  // 🆕 Jika tidak login dan bukan halaman auth, jangan render apa pun (biarkan redirect)
  if (!isAuthenticated && !isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-slate-500 font-bold animate-pulse text-lg">Mengarahkan ke Login...</div>
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