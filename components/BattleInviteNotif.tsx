// components/BattleInviteNotif.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

export default function BattleInviteNotif() {
  const router = useRouter();
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    let channel: any;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ambil undangan yang statusnya 'pending' saat halaman dimuat
      const { data } = await supabase
        .from('battle_invites')
        .select(`
          id, match_id, sender_id,
          sender:profiles!battle_invites_sender_id_fkey(username, avatar_url)
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');
      
      if (data) setInvites(data);

      // Dengarkan Realtime (Undangan baru)
      channel = supabase.channel('battle_invites_channel')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'battle_invites',
          filter: `receiver_id=eq.${user.id}`
        }, async (payload) => {
          // Fetch detail sender karena realtime payload tidak join tabel
          const { data: senderData } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          setInvites(prev => [...prev, { ...payload.new, sender: senderData }]);
        })
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleAction = async (inviteId: string, matchId: string, action: 'accept' | 'reject') => {
    setLoading(inviteId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/battle/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ inviteId, matchId, action })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Hapus dari list
      setInvites(prev => prev.filter(i => i.id !== inviteId));

      if (action === 'accept') {
        // Pindah ke Room
        router.push(`/battle/room/${matchId}`);
      }
    } catch (err: any) {
      alert("Gagal memproses undangan: " + err.message);
    } finally {
      setLoading(null);
    }
  };

  if (invites.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {invites.map((invite) => (
        <div key={invite.id} className="bg-white p-4 rounded-2xl shadow-2xl border-2 border-pink-500 w-80 animate-in slide-in-from-right-8 fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-pink-100 overflow-hidden flex-shrink-0">
              {invite.sender?.avatar_url ? (
                <img src={invite.sender.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-pink-500 font-bold">
                  {invite.sender?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{invite.sender?.username}</p>
              <p className="text-xs text-slate-500">Menantangmu bertanding!</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handleAction(invite.id, invite.match_id, 'reject')}
              disabled={loading === invite.id}
              className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition"
            >
              Tolak
            </button>
            <button 
              onClick={() => handleAction(invite.id, invite.match_id, 'accept')}
              disabled={loading === invite.id}
              className="flex-1 py-2 bg-pink-500 text-white rounded-lg text-sm font-bold hover:bg-pink-600 transition shadow-md"
            >
              {loading === invite.id ? '...' : 'Terima'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}