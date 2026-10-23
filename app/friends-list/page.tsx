// app/friends-list/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { triggerToast } from "@/utils/toast";
import { getMissionsState } from "@/utils/missionEngine";
import { getInventory } from "@/utils/luckyEngine";

export default function FriendsListPage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  
  // State untuk Modal Kirim Hadiah
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [giftType, setGiftType] = useState<"coins" | "freeze">("coins");
  const [giftAmount, setGiftAmount] = useState(10);
  const [myCoins, setMyCoins] = useState(0);
  const [myFreeze, setMyFreeze] = useState(0);

  const fetchFriends = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setMyId(user.id);

    if (user) {
      const { data: friendsData } = await supabase
        .from('friends')
        .select('id, user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendsData && friendsData.length > 0) {
        const friendIds = friendsData.map(f => f.user_id === user.id ? f.friend_id : f.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, total_exp, avatar_url')
          .in('id', friendIds);
        setFriends(friendIds.map(id => profilesData?.find(p => p.id === id) || { id, username: "Unknown" }));
      } else {
        setFriends([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFriends();
    // Ambil saldo koin & freeze kita saat ini
    const ms = getMissionsState();
    if (ms) setMyCoins(ms.coins);
    const inv = getInventory();
    if (inv) setMyFreeze(inv.freeze);
  }, []);

  const handleSendGift = async () => {
    if (!myId || !selectedFriend) return;

    // Validasi saldo
    if (giftType === "coins" && giftAmount > myCoins) return triggerToast("Koin kamu tidak cukup!", "error");
    if (giftType === "freeze" && giftAmount > myFreeze) return triggerToast("Freeze kamu tidak cukup!", "error");

    // 1. Simpan ke database (Supabase)
    const { error } = await supabase.from('gifts').insert({
      sender_id: myId,
      receiver_id: selectedFriend.id,
      item_type: giftType,
      amount: giftAmount,
    });

    if (error) return triggerToast("Gagal mengirim hadiah: " + error.message, "error");

    // 2. Kurangi saldo kita di localStorage
    if (giftType === "coins") {
      const ms = getMissionsState();
      if (ms) {
        ms.coins -= giftAmount;
        localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(ms));
        setMyCoins(ms.coins);
        window.dispatchEvent(new Event("missionUpdated"));
      }
    } else {
      const inv = getInventory();
      if (inv) {
        inv.freeze -= giftAmount;
        localStorage.setItem("kanjiMaster.inventory.v1", JSON.stringify(inv));
        setMyFreeze(inv.freeze);
        window.dispatchEvent(new Event("inventoryUpdated"));
      }
    }

    triggerToast(`Hadiah berhasil dikirim ke ${selectedFriend.username}! 🎁`, "success");
    setSelectedFriend(null); // Tutup modal
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-8 text-center">
          <div className="text-5xl mb-3">👥</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Daftar Teman</h1>
          <p className="text-slate-500">Orang-orang yang sudah berteman denganmu.</p>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 animate-pulse font-bold text-lg py-10">Memuat...</div>
        ) : friends.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-500 shadow-sm">
            <div className="text-4xl mb-3">👻</div>
            <p className="mb-4">Kamu belum punya teman. Yuk cari teman baru!</p>
            <Link href="/friends" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition">Cari Teman</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <div key={friend.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-white shadow-inner flex items-center justify-center text-xl font-bold text-emerald-500 overflow-hidden">
                    {friend.avatar_url ? <img src={friend.avatar_url} className="w-full h-full object-cover"/> : friend.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors truncate">{friend.username}</h3>
                    <p className="text-xs text-slate-500 mt-1">Lv. {Math.floor(Math.sqrt((friend.total_exp || 0) / 50)) + 1} • ⚡ {friend.total_exp || 0} EXP</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/user/${friend.id}`} className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-sm transition">Profil</Link>
                  <button onClick={() => setSelectedFriend(friend)} className="flex-1 bg-pink-50 hover:bg-pink-100 text-pink-600 font-bold py-2 rounded-xl text-sm transition flex items-center justify-center gap-1">
                    🎁 Hadiah
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Kirim Hadiah */}
        {selectedFriend && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
              <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">Kirim Hadiah ke {selectedFriend.username}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">Pilih Hadiah</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setGiftType("coins")} className={`py-3 rounded-xl border-2 font-bold transition ${giftType === "coins" ? "border-pink-500 bg-pink-50 text-pink-600" : "border-slate-200 text-slate-500"}`}>🌸 Koin (Sisa: {myCoins})</button>
                    <button onClick={() => setGiftType("freeze")} className={`py-3 rounded-xl border-2 font-bold transition ${giftType === "freeze" ? "border-cyan-500 bg-cyan-50 text-cyan-600" : "border-slate-200 text-slate-500"}`}>❄️ Freeze (Sisa: {myFreeze})</button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">Jumlah</label>
                  <input type="number" min={1} value={giftAmount} onChange={e => setGiftAmount(Number(e.target.value))} className="w-full border-2 border-slate-200 rounded-xl p-3 text-center text-lg font-bold outline-none focus:border-pink-500" />
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setSelectedFriend(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition">Batal</button>
                  <button onClick={handleSendGift} className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 rounded-xl shadow-md transition">Kirim 🎁</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}