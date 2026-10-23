// app/login/page.tsx
"use client";
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { triggerToast } from '@/utils/toast';
import Link from 'next/link'; // 🆕 Import Link

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // State untuk Icon Mata
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        triggerToast(error.message, "error");
      } else {
        triggerToast("Selamat datang kembali! 🎉", "success");
        setTimeout(() => router.push('/'), 1500);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        triggerToast(error.message, "error");
      } else if (data.user) {
        await supabase.from('profiles').insert([
          { id: data.user.id, username: username, bio: 'Halo! Aku sedang belajar bahasa Jepang 🇯🇵' }
        ]);
        triggerToast('Pendaftaran Berhasil! Silakan Masuk.', "success");
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      {/* Sisi Kiri: Ilustrasi / Branding (Sembunyi di HP) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-indigo-700 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-10 left-10 text-9xl opacity-10 select-none">🌸</div>
        <div className="absolute bottom-10 right-10 text-9xl opacity-10 select-none">⛩️</div>
        
        <div className="relative z-10 text-center text-white max-w-md">
          <div className="text-7xl mb-6">🎌</div>
          <h1 className="text-4xl font-black mb-4 tracking-tight">Kanji Master</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Kuasai 486 Kanji dan 500 Kotoba untuk persiapan JFT. Bergabunglah dengan ribuan pelajar lainnya!
          </p>
        </div>
      </div>

      {/* Sisi Kanan: Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {isLogin ? "Masuk" : "Daftar Akun"}
            </h2>
            <p className="text-slate-500 text-sm">
              {isLogin ? "Senang melihatmu lagi! Lanjutkan belajarmu." : "Mulai perjalanan belajarmu hari ini."}
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="text-sm font-bold text-slate-600 ml-1">Username</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 mt-1 outline-none focus:border-blue-500 focus:bg-white transition" 
                  placeholder="Misal: Abdul Martin" 
                />
              </div>
            )}
            
            <div>
              <label className="text-sm font-bold text-slate-600 ml-1">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 mt-1 outline-none focus:border-blue-500 focus:bg-white transition" 
                placeholder="email@contoh.com" 
              />
            </div>
            
            <div>
              <label className="text-sm font-bold text-slate-600 ml-1">Password</label>
              <div className="relative mt-1">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 pr-12 outline-none focus:border-blue-500 focus:bg-white transition" 
                  placeholder="••••••••" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition p-1"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-95 mt-2"
            >
              {loading ? "Memproses..." : (isLogin ? "Masuk Sekarang" : "Buat Akun")}
            </button>
          </form>

          {/* 🆕 Link Lupa Password & Daftar */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-slate-500">
              {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-bold hover:underline transition">
                {isLogin ? "Daftar gratis" : "Masuk di sini"}
              </button>
            </p>
            
            {isLogin && (
              <p className="text-sm">
                <Link href="/forgot-password" className="text-slate-500 hover:text-blue-600 transition">
                  Lupa password?
                </Link>
              </p>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}