// components/AppLayout.tsx
"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import HeaderStats from "./HeaderStats";

export default function AppLayout({ 
  children, 
  headerVariant = "light" 
}: { 
  children: React.ReactNode;
  headerVariant?: "light" | "dark";
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Sidebar Responsif */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Konten Utama */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full overflow-x-hidden">
        
        {/* Header dengan Tombol Hamburger di HP */}
        <div className="sticky top-0 z-40">
          <div className="bg-white border-b border-slate-200 flex items-center px-3 lg:px-8 h-16 lg:h-20">
            
            {/* Tombol Hamburger (Hanya muncul di Mobile/Tablet) */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden mr-2 p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Header Stats */}
            <div className="flex-1 min-w-0">
              <HeaderStats variant={headerVariant} />
            </div>
          </div>
        </div>

        {/* Konten Halaman */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}