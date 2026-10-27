// app/pesan/page.tsx
"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { triggerToast } from "@/utils/toast";
import { supabase } from "@/utils/supabase";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🆕 Ambil email user yang sedang login (jika ada) untuk default
      const { data: { user } } = await supabase.auth.getUser();
      const finalEmail = email || user?.email || "";

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          email: finalEmail,
          subject: subject,
          message: message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        triggerToast(data.error || "Gagal mengirim pesan", "error");
      } else {
        triggerToast("Pesan berhasil dikirim! Terima kasih 🎉", "success");
        // Reset form
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }
    } catch (err) {
      console.error("Submit Error:", err);
      triggerToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">📬</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Kritik & Saran</h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Punya ide, masukan, atau menemukan bug? Kirimkan pesanmu di sini. Kami sangat menghargai setiap masukan!
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Nama */}
            <div>
              <label className="text-sm font-bold text-slate-700 ml-1">
                Nama <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 mt-1 outline-none focus:border-blue-500 focus:bg-white transition 
                           text-slate-800 font-medium placeholder:text-slate-500"
                placeholder="Nama kamu"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-bold text-slate-700 ml-1">
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 mt-1 outline-none focus:border-blue-500 focus:bg-white transition 
                           text-slate-800 font-medium placeholder:text-slate-500"
                placeholder="email@contoh.com"
              />
              <p className="text-xs text-slate-400 mt-1 ml-1">
                Isi email agar kami bisa membalas pesanmu
              </p>
            </div>

            {/* Subjek */}
            <div>
              <label className="text-sm font-bold text-slate-700 ml-1">
                Subjek <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 mt-1 outline-none focus:border-blue-500 focus:bg-white transition 
                           text-slate-800 font-medium placeholder:text-slate-500"
                placeholder="Topik pesan (misal: Saran Fitur Baru)"
              />
            </div>

            {/* Pesan */}
            <div>
              <label className="text-sm font-bold text-slate-700 ml-1">
                Pesan <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 mt-1 outline-none focus:border-blue-500 focus:bg-white transition 
                           text-slate-800 font-medium placeholder:text-slate-500 resize-none"
                placeholder="Tulis pesanmu di sini..."
              />
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 
                         disabled:from-slate-300 disabled:to-slate-400 text-white font-bold py-4 rounded-xl 
                         transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Mengirim...
                </>
              ) : (
                <>📨 Kirim Pesan</>
              )}
            </button>
          </form>
        </div>

        {/* Info Tambahan */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <p className="text-sm font-bold text-amber-700">Tips</p>
            <p className="text-sm text-amber-600">
              Untuk laporan bug, sertakan langkah-langkah untuk mereproduksi bug dan screenshot jika memungkinkan.
            </p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}