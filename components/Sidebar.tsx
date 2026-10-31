// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const [showOthers, setShowOthers] = useState(false);

  // Menu Utama
  const mainMenu = [
    { name: "Dashboard", href: "/", icon: "🏠" },
    { name: "Belajar Kanji", href: "/belajar/kanji", icon: "📚" },
    { name: "Belajar Kotoba", href: "/belajar/kotoba", icon: "📖" },
    { name: "Papan Misi", href: "/missions", icon: "🎯" },
    { name: "Leaderboard", href: "/leaderboard", icon: "🏆" },
    { name: "Profil", href: "/profil", icon: "👤" },
  ];

  // Menu Lainnya (Disembunyikan)
  const otherMenu = [
    { name: "Cari Teman", href: "/friends", icon: "🤝" },
    { name: "Daftar Teman", href: "/friends-list", icon: "👥" },
    { name: "Permintaan", href: "/friend-requests", icon: "📩" },
    { name: "Kalender", href: "/kalender", icon: "📅" },
    { name: "Sakura Shop", href: "/shop", icon: "🌸" },
    { name: "Kritik & Saran", href: "/pesan", icon: "📬" },
  ];

  return (
    <>
      {/* Overlay Gelap (Hanya muncul di HP saat sidebar terbuka) */}
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
        <nav className="flex-1 space-y-1.5 overflow-y-auto pb-4 scrollbar-hide">
          {/* Menu Utama */}
          {mainMenu.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
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

          {/* Tombol Lainnya */}
          <button
            onClick={() => setShowOthers(!showOthers)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
              showOthers ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-xl">📂</span>
              <span className="text-sm tracking-wide">Lainnya</span>
            </div>
            <span className={`text-xs transition-transform duration-300 ${showOthers ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {/* Submenu Lainnya */}
          <div className={`overflow-hidden transition-all duration-300 ${showOthers ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="pl-4 space-y-1 mt-1 border-l-2 border-slate-100 ml-6">
              {otherMenu.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-xs tracking-wide">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}