// app/forgot-password/page.tsx
"use client";
import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { triggerToast } from "@/utils/toast";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`, 
    });

    if (error) {
      triggerToast(error.message, "error");
    } else {
      triggerToast("Link reset password telah dikirim ke email kamu!", "success");
      setEmail("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🔑</div>
          <h1 className="text-2xl font-bold text-slate-800">Lupa Password?</h1>
          <p className="text-sm text-slate-500 mt-2">Masukkan email kamu, kami akan mengirimkan link untuk mereset password.</p>
        </div>
        
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-600">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="w-full border-2 border-slate-200 rounded-xl p-3 mt-1 outline-none focus:border-blue-500 transition" 
              placeholder="email@contoh.com" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl transition shadow-md"
          >
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            ← Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  );
}