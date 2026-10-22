// components/AuthGuard.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { syncDataToDatabase } from "@/utils/syncEngine";
import { checkStreakExpiry } from "@/utils/luckyEngine";

// Pisahkan logika ke komponen internal
function AuthGuardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const isAuthPage = pathname === "/login" || pathname === "/register";

      if (!session && !isAuthPage) {
        router.push("/login");
      } else if (session && isAuthPage) {
        router.push("/");
      } else {
        if (session) {
          checkStreakExpiry();
          syncDataToDatabase();
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