export type AchievementKanji = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  type: "category" | "mode" | "progress";
  categoryTarget?: string; // Nama slug kategori (untuk tipe category)
  targetCount?: number;    // Target jumlah (untuk tipe category & progress)
};

export const ACHIEVEMENTS_KANJI: AchievementKanji[] = [
  // ===== 1. ACHIEVEMENT KATEGORI (12) =====
  { id: "cat_waktu", type: "category", categoryTarget: "waktu-keterangan-waktu", targetCount: 41, name: "時間の達人 (Jikan no Tatsujin)", desc: "Ahli Waktu: Hafal 41 dari 41 kanji kategori Waktu & Keterangan Waktu.", icon: "⏰", color: "bg-blue-100 text-blue-800" },
  { id: "cat_hari", type: "category", categoryTarget: "nama-hari", targetCount: 18, name: "曜日の賢者 (Yōbi no Kenja)", desc: "Sang Bijak Hari: Hafal 18 dari 18 kanji kategori Nama Hari.", icon: "📅", color: "bg-indigo-100 text-indigo-800" },
  { id: "cat_kalender", type: "category", categoryTarget: "tanggal-angka", targetCount: 41, name: "暦の達人 (Koyomi no Tatsujin)", desc: "Ahli Kalender: Hafal 41 dari 41 kanji kategori Tanggal & Angka.", icon: "🗓️", color: "bg-sky-100 text-sky-800" },
  { id: "cat_urutan", type: "category", categoryTarget: "urutan-waktu", targetCount: 18, name: "時の探究者 (Toki no Tankyūsha)", desc: "Penjelajah Waktu: Hafal 18 dari 18 kanji kategori Waktu Berdasarkan Urutan.", icon: "⏳", color: "bg-cyan-100 text-cyan-800" },
  { id: "cat_arah", type: "category", categoryTarget: "tempat-arah", targetCount: 40, name: "方角の探検家 (Hōgaku no Tankenka)", desc: "Penjelajah Arah: Hafal 40 dari 40 kanji kategori Tempat & Arah.", icon: "🧭", color: "bg-teal-100 text-teal-800" },
  { id: "cat_gerakan", type: "category", categoryTarget: "gerakan-kegiatan", targetCount: 22, name: "行動の達人 (Kōdō no Tatsujin)", desc: "Ahli Gerakan: Hafal 22 dari 22 kanji kategori Gerakan & Kegiatan.", icon: "🏃‍♂️", color: "bg-emerald-100 text-emerald-800" },
  { id: "cat_jft", type: "category", categoryTarget: "tambahan-jft", targetCount: 31, name: "試験の挑戦者 (Shiken no Chōsensha)", desc: "Penantang Ujian: Hafal 31 dari 31 kanji kategori Tambahan Soal JFT.", icon: "✍️", color: "bg-green-100 text-green-800" },
  { id: "cat_orang", type: "category", categoryTarget: "orang-pekerjaan", targetCount: 85, name: "人々の賢者 (Hitobito no Kenja)", desc: "Sang Bijak Kehidupan: Hafal 85 dari 85 kanji kategori Orang, Keluarga & Pekerjaan.", icon: "👨‍👩‍👧‍👦", color: "bg-pink-100 text-pink-800" },
  { id: "cat_alam", type: "category", categoryTarget: "alam-tubuh-sifat", targetCount: 79, name: "自然の賢者 (Shizen no Kenja)", desc: "Sang Bijak Alam: Hafal 79 dari 79 kanji kategori Alam, Tubuh & Sifat.", icon: "🌿", color: "bg-lime-100 text-lime-800" },
  { id: "cat_sekolah", type: "category", categoryTarget: "sekolah-benda", targetCount: 48, name: "知識の探究者 (Chishiki no Tankyūsha)", desc: "Pencari Pengetahuan: Hafal 48 dari 48 kanji kategori Sekolah & Benda.", icon: "🎓", color: "bg-orange-100 text-orange-800" },
  { id: "cat_hiburan", type: "category", categoryTarget: "hiburan-fasilitas", targetCount: 42, name: "文化の探究者 (Bunka no Tankyūsha)", desc: "Penjelajah Budaya: Hafal 42 dari 42 kanji kategori Hiburan & Fasilitas Umum.", icon: "🎭", color: "bg-amber-100 text-amber-800" },
  { id: "cat_angka", type: "category", categoryTarget: "angka-bilangan", targetCount: 21, name: "数の支配者 (Kazu no Shihaisha)", desc: "Penguasa Angka: Hafal 21 dari 21 kanji kategori Angka & Bilangan.", icon: "🔢", color: "bg-red-100 text-red-800" },

  // ===== 2. ACHIEVEMENT MODE (12) =====
  // Ujian
  { id: "mode_ujian_1", type: "mode", name: "初受験 (Hatsu Juken)", desc: "Menyelesaikan Ujian Kanji untuk pertama kalinya.", icon: "📝", color: "bg-blue-100 text-blue-800" },
  { id: "mode_ujian_2", type: "mode", name: "優秀な成績 (Yūshū na Seiseki)", desc: "Mendapatkan nilai minimal 80% di Ujian Kanji.", icon: "🌟", color: "bg-yellow-100 text-yellow-800" },
  { id: "mode_ujian_3", type: "mode", name: "満点合格 (Manten Gōkaku)", desc: "Mendapatkan nilai 100% di Ujian Kanji.", icon: "💯", color: "bg-emerald-100 text-emerald-800" },
  { id: "mode_ujian_4", type: "mode", name: "連続合格 (Renzoku Gōkaku)", desc: "Mendapat nilai minimal 80% dalam 5 ujian berturut-turut.", icon: "🔥", color: "bg-orange-100 text-orange-800" },
  
  // Survival
  { id: "mode_survival_1", type: "mode", name: "初生存 (Hatsu Seizon)", desc: "Menyelesaikan Mode Survival untuk pertama kalinya.", icon: "🏃", color: "bg-purple-100 text-purple-800" },
  { id: "mode_survival_2", type: "mode", name: "十連勝 (Jū Renshō)", desc: "Menjawab 10 kanji berturut-turut dengan benar di Survival.", icon: "🔟", color: "bg-indigo-100 text-indigo-800" },
  { id: "mode_survival_3", type: "mode", name: "不屈 (Fukutsu)", desc: "Mencapai 20 jawaban benar dalam satu sesi Survival.", icon: "💪", color: "bg-red-100 text-red-800" },
  { id: "mode_survival_4", type: "mode", name: "伝説の生存者 (Densetsu no Seizonsha)", desc: "Mencapai 50 jawaban benar dalam satu sesi Survival.", icon: "👑", color: "bg-amber-200 text-amber-900" },

  // Latihan Acak
  { id: "mode_acak_1", type: "mode", name: "運試し (Un-dameshi)", desc: "Menyelesaikan Latihan Acak 50 Kanji pertama kali.", icon: "🎲", color: "bg-teal-100 text-teal-800" },
  { id: "mode_acak_2", type: "mode", name: "五十問達成 (Gojūmon Tassei)", desc: "Menyelesaikan 50 soal dalam satu sesi Latihan Acak.", icon: "5️⃣0️⃣", color: "bg-cyan-100 text-cyan-800" },
  { id: "mode_acak_3", type: "mode", name: "正確無比 (Seikaku Muhi)", desc: "Menjawab 50 dari 50 soal dengan benar di Latihan Acak.", icon: "🎯", color: "bg-green-100 text-green-800" },
  { id: "mode_acak_4", type: "mode", name: "百戦錬磨 (Hyakusen Renma)", desc: "Menyelesaikan 50 sesi Latihan Acak.", icon: "⚔️", color: "bg-slate-200 text-slate-800" },

  // ===== 3. ACHIEVEMENT PROGRES HAFALAN (6) =====
  { id: "prog_25", type: "progress", targetCount: 25, name: "初学者 (Shogakusha)", desc: "Menghafal 25 kanji unik (5%).", icon: "🌱", color: "bg-green-100 text-green-800" },
  { id: "prog_100", type: "progress", targetCount: 100, name: "努力家 (Doryokuka)", desc: "Menghafal 100 kanji unik (21%).", icon: "📚", color: "bg-blue-100 text-blue-800" },
  { id: "prog_200", type: "progress", targetCount: 200, name: "漢字の戦士 (Kanji no Senshi)", desc: "Menghafal 200 kanji unik (41%).", icon: "🛡️", color: "bg-indigo-100 text-indigo-800" },
  { id: "prog_300", type: "progress", targetCount: 300, name: "漢字の侍 (Kanji no Samurai)", desc: "Menghafal 300 kanji unik (62%).", icon: "⚔️", color: "bg-purple-100 text-purple-800" },
  { id: "prog_400", type: "progress", targetCount: 400, name: "漢字マスター (Kanji Masutā)", desc: "Menghafal 400 kanji unik (82%).", icon: "🥋", color: "bg-rose-100 text-rose-800" },
  { id: "prog_486", type: "progress", targetCount: 486, name: "漢字の伝説 (Kanji no Densetsu)", desc: "Menguasai semua 486 kanji.", icon: "👑", color: "bg-gradient-to-r from-yellow-300 to-amber-500 text-white" },
];