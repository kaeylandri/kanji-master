// app/friends/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { triggerToast } from "@/utils/toast";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

export default function FriendsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [requestedIds, setRequestedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setMyId(user.id);

        const { data: friendData } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', user.id);
        
        if (friendData) setRequestedIds(friendData.map(f => f.friend_id));
      }

      const { data, error } = await supabase.from('profiles').select('*');
      if (data) setUsers(data);
      if (error) console.error("Error fetching users:", error);
      
      setIsLoading(false);
    };
    
    fetchInitialData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const isMe = u.id === myId;
    if (searchQuery.trim() === "" && isMe) return false;
    return matchesSearch;
  });

  const handleAddFriend = async (friendId: string, friendName: string) => {
    if (!myId) {
      triggerToast("Kamu harus login dulu!", "error");
      return;
    }
    if (myId === friendId) {
      triggerToast("Kamu tidak bisa berteman dengan diri sendiri! 😅", "info");
      return;
    }
    
    const { error } = await supabase.from('friends').insert([
      { user_id: myId, friend_id: friendId, status: 'pending' }
    ]);

    if (error) {
      if (error.code === '23505') triggerToast("Kamu sudah berteman atau mengirim permintaan.", "info");
      else triggerToast("Gagal: " + error.message, "error");
    } else {
      triggerToast(`Permintaan terkirim ke ${friendName}! 🎉`, "success");
      setRequestedIds(prev => [...prev, friendId]);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto relative z-10">
        
        <div className="mb-10 text-center">
          <div className="text-6xl mb-4 animate-bounce">🤝</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Cari Teman Belajar</h1>
          <p className="text-slate-500">Temukan pengguna lain, bandingkan EXP, dan bertemanlah!</p>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="mb-10 relative flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Ketik username lalu tekan Enter..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 pl-12 outline-none focus:border-blue-500 shadow-sm transition 
                         text-lg font-medium text-slate-800 placeholder:text-slate-500" 
              // 🆕 text-slate-800 (teks yang diketik tegas)
              // 🆕 placeholder:text-slate-500 (placeholder lebih jelas)
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">🔍</span>
          </div>
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-4 sm:py-0 rounded-2xl shadow-md transition active:scale-95"
          >
            Cari
          </button>
        </form>

        {isLoading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse font-bold text-xl">
            Memuat data user...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
                <div className="text-4xl mb-2">👻</div>
                {searchQuery ? `Tidak ada user dengan nama "${searchQuery}".` : "Belum ada user lain di database."}
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isMe = user.id === myId;
                const isRequested = requestedIds.includes(user.id);

                return (
                  <div key={user.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-full border-2 border-white shadow-inner flex items-center justify-center text-xl font-bold overflow-hidden shrink-0 ${isMe ? 'bg-amber-100 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} className="w-full h-full object-cover"/>
                        ) : (
                          user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors truncate">
                          {user.username} {isMe && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-1 border border-amber-200">Kamu</span>}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold">Lv. {Math.floor(Math.sqrt(user.total_exp / 50)) + 1}</span>
                          <span>⚡ {user.total_exp} EXP</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link 
                        href={`/user/${user.id}`}
                        className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-sm transition"
                      >
                        Lihat Profil
                      </Link>
                      
                      {!isMe && (
                        isRequested ? (
                          <button 
                            disabled
                            className="flex-1 bg-emerald-100 text-emerald-600 font-bold py-2 rounded-xl border border-emerald-200 text-sm cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            ✅ Terkirim
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleAddFriend(user.id, user.username)}
                            className="flex-1 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white font-bold py-2 rounded-xl border border-emerald-200 hover:border-emerald-500 transition-all text-sm active:scale-95"
                          >
                            ➕ Tambah
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}