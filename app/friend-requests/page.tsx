// app/friend-requests/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import AppLayout from "@/components/AppLayout";
import { triggerToast } from "@/utils/toast";

export default function FriendRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 1. Ambil data permintaan (tanpa join dulu untuk menghindari error RLS)
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('id, status, user_id')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (friendsError) {
        console.error("Error ambil friends:", friendsError);
        setLoading(false);
        return;
      }

      if (friendsData && friendsData.length > 0) {
        // 2. Ambil ID pengirim
        const senderIds = friendsData.map(f => f.user_id);

        // 3. Ambil profil pengirim dari tabel profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, total_exp, avatar_url')
          .in('id', senderIds);

        if (profilesError) {
          console.error("Error ambil profiles:", profilesError);
        }

        // 4. Gabungkan data
        const combinedData = friendsData.map(req => {
          const profile = profilesData?.find(p => p.id === req.user_id);
          return {
            ...req,
            sender: profile || { username: "Pengguna Tidak Dikenal", total_exp: 0 }
          };
        });

        setRequests(combinedData);
      } else {
        setRequests([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: number, action: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('friends')
      .update({ status: action })
      .eq('id', requestId);

    if (!error) {
      triggerToast(`Permintaan ${action === 'accepted' ? 'diterima' : 'ditolak'}!`, "success");
      setRequests(requests.filter(r => r.id !== requestId));
    } else {
      triggerToast("Gagal memproses permintaan.", "error");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-8 text-center">
          <div className="text-5xl mb-3">📩</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Permintaan Pertemanan</h1>
          <p className="text-slate-500">Terima atau tolak orang yang ingin berteman denganmu.</p>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 animate-pulse font-bold text-lg py-10">Memuat...</div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-500 shadow-sm">
            Tidak ada permintaan pertemanan baru.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const sender = req.sender;
              return (
                <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 hover:shadow-md transition">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl text-blue-600 overflow-hidden shrink-0">
                      {sender?.avatar_url ? (
                        <img src={sender.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        sender?.username?.charAt(0) || "👤"
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{sender?.username}</h3>
                      <p className="text-xs text-slate-500">Level {Math.floor(Math.sqrt((sender?.total_exp || 0) / 50)) + 1} • {sender?.total_exp || 0} EXP</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleAction(req.id, 'rejected')}
                      className="flex-1 bg-rose-50 text-rose-600 hover:bg-rose-100 px-6 py-2.5 rounded-xl font-bold transition active:scale-95"
                    >
                      Tolak
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'accepted')}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-md active:scale-95"
                    >
                      Terima
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}