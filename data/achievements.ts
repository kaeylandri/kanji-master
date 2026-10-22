export type Achievement = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  type: "category" | "general";
  categoryTarget?: string; // Jika tipe category, masukkan nama kategorinya
  targetCount?: number;    // Target jumlah kotoba (biasanya 25)
};

export const ACHIEVEMENTS_KOTOBA: Achievement[] = [
  // ===== 20 ACHIEVEMENT KATEGORI =====
  { id: "cat_salam", type: "category", categoryTarget: "Salam dan Ungkapan", targetCount: 25, name: "挨拶マスター (Aisatsu Masutā)", desc: "Menguasai 25 kotoba kategori salam dan ungkapan sehari-hari.", icon: "🙇‍♂️", color: "bg-blue-100 text-blue-800" },
  { id: "cat_keluarga", type: "category", categoryTarget: "Orang dan Keluarga", targetCount: 25, name: "家族の絆 (Kazoku no Kizuna)", desc: "Menguasai 25 kotoba kategori orang dan keluarga.", icon: "👨‍👩‍👧‍👦", color: "bg-pink-100 text-pink-800" },
  { id: "cat_waktu", type: "category", categoryTarget: "Waktu dan Tanggal", targetCount: 25, name: "時間の達人 (Jikan no Tatsujin)", desc: "Menguasai 25 kotoba kategori waktu dan tanggal.", icon: "⏰", color: "bg-indigo-100 text-indigo-800" },
  { id: "cat_angka", type: "category", categoryTarget: "Angka dan Satuan", targetCount: 25, name: "数字の賢者 (Sūji no Kenja)", desc: "Menguasai 25 kotoba kategori angka dan satuan hitung.", icon: "🔢", color: "bg-slate-100 text-slate-800" },
  { id: "cat_rumah", type: "category", categoryTarget: "Rumah dan Benda", targetCount: 25, name: "家の守護者 (Ie no Shugosha)", desc: "Menguasai 25 kotoba kategori benda-benda di rumah.", icon: "🏠", color: "bg-orange-100 text-orange-800" },
  { id: "cat_sekolah", type: "category", categoryTarget: "Sekolah dan Pekerjaan", targetCount: 25, name: "学びの探究者 (Manabi no Tankyūsha)", desc: "Menguasai 25 kotoba kategori sekolah dan pekerjaan.", icon: "🎓", color: "bg-teal-100 text-teal-800" },
  { id: "cat_aktivitas", type: "category", categoryTarget: "Aktivitas Sehari-hari", targetCount: 25, name: "日常の達人 (Nichijō no Tatsujin)", desc: "Menguasai 25 kotoba kategori kegiatan sehari-hari.", icon: "🏃‍♂️", color: "bg-green-100 text-green-800" },
  { id: "cat_perjalanan", type: "category", categoryTarget: "Perjalanan dan Transportasi", targetCount: 25, name: "旅の冒険者 (Tabi no Bōkensha)", desc: "Menguasai 25 kotoba kategori perjalanan dan transportasi.", icon: "✈️", color: "bg-sky-100 text-sky-800" },
  { id: "cat_makanan", type: "category", categoryTarget: "Makanan dan Minuman", targetCount: 25, name: "美食家 (Bishokuka)", desc: "Menguasai 25 kotoba kategori makanan dan minuman.", icon: "🍣", color: "bg-red-100 text-red-800" },
  { id: "cat_memasak", type: "category", categoryTarget: "Memasak dan Rasa", targetCount: 25, name: "料理の達人 (Ryōri no Tatsujin)", desc: "Menguasai 25 kotoba kategori memasak dan rasa.", icon: "🍳", color: "bg-amber-100 text-amber-800" },
  { id: "cat_alam", type: "category", categoryTarget: "Cuaca dan Alam", targetCount: 25, name: "自然の観察者 (Shizen no Kansatsusha)", desc: "Menguasai 25 kotoba kategori cuaca dan alam.", icon: "🌿", color: "bg-emerald-100 text-emerald-800" },
  { id: "cat_hewan", type: "category", categoryTarget: "Hewan dan Tumbuhan", targetCount: 25, name: "生き物博士 (Ikimono Hakase)", desc: "Menguasai 25 kotoba kategori hewan dan tumbuhan.", icon: "🐈", color: "bg-lime-100 text-lime-800" },
  { id: "cat_tubuh", type: "category", categoryTarget: "Tubuh dan Kesehatan", targetCount: 25, name: "健康の守り人 (Kenkō no Mamoribito)", desc: "Menguasai 25 kotoba kategori tubuh dan kesehatan.", icon: "🫀", color: "bg-rose-100 text-rose-800" },
  { id: "cat_sifat", type: "category", categoryTarget: "Kata Sifat Ukuran", targetCount: 25, name: "言葉の表現者 (Kotoba no Hyōgensha)", desc: "Menguasai 25 kotoba kategori kata sifat, ukuran, dan kondisi.", icon: "📏", color: "bg-cyan-100 text-cyan-800" },
  { id: "cat_perasaan", type: "category", categoryTarget: "Perasaan dan Kepribadian", targetCount: 25, name: "心の理解者 (Kokoro no Rikaisha)", desc: "Menguasai 25 kotoba kategori perasaan dan kepribadian.", icon: "❤️", color: "bg-fuchsia-100 text-fuchsia-800" },
  { id: "cat_tempat", type: "category", categoryTarget: "Tempat Umum", targetCount: 25, name: "街の探検家 (Machi no Tankenka)", desc: "Menguasai 25 kotoba kategori tempat dan fasilitas umum.", icon: "🏙️", color: "bg-slate-200 text-slate-800" },
  { id: "cat_belanja", type: "category", categoryTarget: "Belanja dan Uang", targetCount: 25, name: "買い物名人 (Kaimono Meijin)", desc: "Menguasai 25 kotoba kategori belanja dan uang.", icon: "🛍️", color: "bg-yellow-100 text-yellow-800" },
  { id: "cat_hobi", type: "category", categoryTarget: "Hobi dan Hiburan", targetCount: 25, name: "趣味の達人 (Shumi no Tatsujin)", desc: "Menguasai 25 kotoba kategori hobi, hiburan, dan teknologi.", icon: "🎮", color: "bg-violet-100 text-violet-800" },
  { id: "cat_katakerja", type: "category", categoryTarget: "Kata Kerja Tambahan", targetCount: 25, name: "行動の達人 (Kōdō no Tatsujin)", desc: "Menguasai 25 kotoba kategori kata kerja dan interaksi.", icon: "🤝", color: "bg-blue-200 text-blue-900" },
  { id: "cat_keterangan", type: "category", categoryTarget: "Kata Keterangan", targetCount: 25, name: "表現の達人 (Hyōgen no Tatsujin)", desc: "Menguasai 25 kotoba kategori kata keterangan dan ungkapan.", icon: "🗣️", color: "bg-purple-100 text-purple-800" },

  // ===== 10 ACHIEVEMENT UMUM =====
  { id: "gen_1", type: "general", name: "はじめの一歩 (Hajime no Ippo)", desc: "Menyelesaikan kuis pertama berisi 25 soal.", icon: "🐣", color: "bg-green-100 text-green-800" },
  { id: "gen_2", type: "general", name: "優等生 (Yūtōsei)", desc: "Mendapatkan minimal 20 jawaban benar dari 25 soal.", icon: "🎖️", color: "bg-blue-100 text-blue-800" },
  { id: "gen_3", type: "general", name: "満点 (Manten)", desc: "Menjawab 25 dari 25 soal dengan benar.", icon: "💯", color: "bg-emerald-100 text-emerald-800" },
  { id: "gen_4", type: "general", name: "五つ星 (Itsutsu Boshi)", desc: "Menyelesaikan 5 kategori kotoba.", icon: "⭐", color: "bg-yellow-100 text-yellow-800" },
  { id: "gen_5", type: "general", name: "半分制覇 (Hanbun Seiha)", desc: "Menyelesaikan 10 dari 20 kategori.", icon: "⛰️", color: "bg-orange-100 text-orange-800" },
  { id: "gen_6", type: "general", name: "完全制覇 (Kanzen Seiha)", desc: "Menyelesaikan seluruh 20 kategori atau 500 kotoba.", icon: "🏆", color: "bg-amber-200 text-amber-900" },
  { id: "gen_7", type: "general", name: "七日間の努力 (Nanokakan no Doryoku)", desc: "Belajar dan menyelesaikan kuis setiap hari selama 7 hari berturut-turut.", icon: "🔥", color: "bg-red-100 text-red-800" },
  { id: "gen_8", type: "general", name: "不屈の精神 (Fukutsu no Seishin)", desc: "Setelah skor di bawah 60%, raih minimal 80% pada percobaan berikutnya.", icon: "💪", color: "bg-indigo-100 text-indigo-800" },
  { id: "gen_9", type: "general", name: "言葉の収集家 (Kotoba no Shūshūka)", desc: "Menjawab benar seluruh 500 kotoba unik setidaknya satu kali.", icon: "📚", color: "bg-cyan-100 text-cyan-800" },
  { id: "gen_10", type: "general", name: "伝説の学習者 (Densetsu no Gakushūsha)", desc: "Mendapatkan seluruh 20 achievement kategori dan achievement penguasaan 500 kotoba.", icon: "🌟", color: "bg-gradient-to-r from-yellow-300 to-amber-500 text-white" },
];