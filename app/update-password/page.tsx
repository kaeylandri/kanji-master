// app/update-password/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { triggerToast } from "@/utils/toast";
import Link from "next/link";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // 🆕 Beri jeda agar Supabase selesai membaca token dari URL
    const timer = setTimeout(async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        setErrorMsg("Link reset password tidak valid atau sudah kadaluarsa. Silakan minta link baru.");
        setLoading(false);
        return;
      }
      
      setLoading(false);
    }, 800); // Jeda 800ms

    // 🆕 Dengarkan event jika Supabase berhasil menangkap token PASSWORD_RECOVERY
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    if (password !== confirmPassword) {
      triggerToast("Password dan Konfirmasi Password tidak cocok!", "error");
      setUpdating(false);
      return;
    }

    if (password.length < 6) {
      triggerToast("Password minimal 6 karakter!", "error");
      setUpdating(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) {
        triggerToast(error.message, "error");
      } else {
        triggerToast("Password berhasil diubah! Silakan login kembali.", "success");
        await supabase.auth.signOut();
        router.push("/login");
      }
    } catch (err: any) {
      triggerToast("Terjadi kesalahan sistem.", "error");
    } finally {
      setUpdating(false);
    }
  };

  // Tampilan Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="text-4xl mb-4 animate-bounce">🛡️</div>
        <p className="text-slate-500 font-bold animate-pulse">Memeriksa keamanan...</p>
        <p className="text-xs text-slate-400 mt-2">Menunggu validasi token dari email.</p>
      </div>
    );
  }

  // Tampilan Error (Link Kadaluarsa)
  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
          <p className="text-slate-500 mb-6">{errorMsg}</p>
          <Link href="/forgot-password" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition block w-full">
            Minta Link Baru
          </Link>
        </div>
      </div>
    );
  }

  // Tampilan Form Ganti Password
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full">
        
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-slate-800">Buat Password Baru</h1>
          <p className="text-sm text-slate-500 mt-2">Masukkan password baru untuk akunmu.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password Baru</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Konfirmasi Password Baru</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold py-3 rounded-xl transition shadow-md active:scale-95 flex justify-center items-center gap-2"
          >
            {updating ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-blue-500 transition">
            Batal dan kembali ke Login
          </Link>
        </div>

      </div>
    </div>
  );
}