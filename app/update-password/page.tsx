// app/update-password/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { triggerToast } from "@/utils/toast";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return triggerToast("Password dan Konfirmasi tidak cocok!", "error");
    }
    if (password.length < 6) {
      return triggerToast("Password minimal 6 karakter!", "error");
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      triggerToast(error.message, "error");
    } else {
      triggerToast("Password berhasil diperbarui! Silakan login kembali.", "success");
      await supabase.auth.signOut();
      setTimeout(() => router.push("/login"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🔒</div>
          <h1 className="text-2xl font-bold text-slate-800">Buat Password Baru</h1>
          <p className="text-sm text-slate-500 mt-2">Masukkan password baru untuk akunmu.</p>
        </div>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-600">Password Baru</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="w-full border-2 border-slate-200 rounded-xl p-3 mt-1 outline-none focus:border-blue-500 transition" 
              placeholder="Minimal 6 karakter" 
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-600">Konfirmasi Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              className="w-full border-2 border-slate-200 rounded-xl p-3 mt-1 outline-none focus:border-blue-500 transition" 
              placeholder="Ulangi password baru" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold py-3 rounded-xl transition shadow-md"
          >
            {loading ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
      </div>
    </div>
  );
}