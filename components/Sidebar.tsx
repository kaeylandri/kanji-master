// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: "🏠" },
    { name: "Cari Teman", href: "/friends", icon: "🤝" },
    { name: "Permintaan", href: "/friend-requests", icon: "📩" },
    { name: "Leaderboard", href: "/leaderboard", icon: "🏆" },
    { name: "Belajar Kanji", href: "/belajar/kanji", icon: "📚" },
    { name: "Belajar Kotoba", href: "/belajar/kotoba", icon: "📖" },
    { name: "Papan Misi", href: "/missions", icon: "🎯" },
    { name: "Kalender", href: "/kalender", icon: "📅" },
    { name: "Sakura Shop", href: "/shop", icon: "🌸" },
    { name: "Profil", href: "/profil", icon: "👤" },
  ];

  return (
    <>
      {/* 🆕 Overlay Gelap (Hanya muncul di HP saat sidebar terbuka) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 h-screen bg-white border-r border-slate-200 fixed left-0 top-0 flex flex-col p-4 z-50 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        
        {/* Tombol Close (Hanya di HP) */}
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
        >
          ✕
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-8 px-4 text-slate-800" onClick={() => setIsOpen(false)}>
          <span className="text-3xl">🎌</span>
          <span className="text-xl font-extrabold tracking-tight">Kanji Master</span>
        </Link>

        {/* Menu List */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)} // Tutup sidebar saat menu diklik di HP
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}