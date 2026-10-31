// app/battle/lobby/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { BattleMode } from "@/utils/battleTypes";
import Link from "next/link";

export default function BattleLobbyPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<any[]>([]);
  const [mode, setMode] = useState<BattleMode>('kanji');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFriends() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      // Ambil ID teman (dua arah)
      const { data: req1 } = await supabase.from('friends').select('friend_id').eq('user_id', user.id).eq('status', 'accepted');
      const { data: req2 } = await supabase.from('friends').select('user_id').eq('friend_id', user.id).eq('status', 'accepted');

      const friendIds = [
        ...(req1?.map(r => r.friend_id) || []),
        ...(req2?.map(r => r.user_id) || [])
      ];

      if (friendIds.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Ambil profil teman
      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', friendIds);
      if (profiles) setFriends(profiles);
      setLoading(false);
    }
    fetchFriends();
  }, [router]);

  const handleInvite = async (receiverId: string) => {
    setInviting(receiverId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/battle/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ receiverId, mode })
      });

      const data = await res.json();
      
      // 🆕 KODE PENTING: Jika error karena "sedang di pertandingan lain",
      // kita bersihkan paksa sisa undangan lama yang nyangkut.
      if (!res.ok) {
        if (data.error === "Pemain sedang dalam pertandingan lain") {
           // Coba batalkan match lama yang nyangkut
           const { data: user } = await supabase.auth.getUser();
           if (user.user) {
             // Cari match_id yang nyangkut
             const { data: stuckPart } = await supabase
                .from('battle_participants')
                .select('match_id')
                .eq('user_id', user.user.id)
                .in('status', ['waiting', 'active', 'paused'])
                .maybeSingle();
             
             if (stuckPart) {
               // Batalkan paksa di database
               await supabase.from('battle_matches').update({ status: 'cancelled' }).eq('id', stuckPart.match_id);
               throw new Error("Sistem membersihkan undangan lama. Silakan klik Tantang lagi.");
             }
           }
        }
        throw new Error(data.error);
      }

      // Jika sukses, arahkan ke halaman ruang tunggu (room)
      router.push(`/battle/room/${data.matchId}`);

    } catch (err: any) {
      alert("Gagal mengirim undangan: " + err.message);
      setInviting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/battle" className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-100 transition">
            ⬅️ Kembali
          </Link>
          <h1 className="text-3xl font-black text-slate-800">Pilih Lawanmu</h1>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
          <h2 className="font-bold text-slate-700 mb-4">1. Pilih Mode Pertandingan</h2>
          <div className="grid grid-cols-3 gap-3">
            {(['kanji', 'kotoba', 'random'] as BattleMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-3 rounded-xl font-bold capitalize transition-all border-2 ${
                  mode === m 
                    ? 'bg-blue-50 border-blue-500 text-blue-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="font-bold text-slate-700 mb-4">2. Pilih Teman untuk Ditantang</h2>
          
          {loading ? (
            <p className="text-center text-slate-500 py-8 animate-pulse">Memuat daftar teman...</p>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">Kamu belum punya teman yang bisa ditantang.</p>
              <Link href="/friends" className="text-blue-500 font-bold hover:underline">
                Cari Teman Dulu Yuk!
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                      {f.avatar_url ? (
                        <img src={f.avatar_url} alt={f.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-emerald-100 text-emerald-600">
                          {f.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-slate-700">{f.username}</span>
                  </div>
                  
                  <button
                    onClick={() => handleInvite(f.id)}
                    disabled={inviting === f.id}
                    className={`px-6 py-2 rounded-xl font-bold text-white transition-all ${
                      inviting === f.id 
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-pink-500 hover:bg-pink-600 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {inviting === f.id ? 'Mengundang...' : 'Tantang ⚔️'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}