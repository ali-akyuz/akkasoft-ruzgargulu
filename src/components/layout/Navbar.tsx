import React from 'react';
import { Wind, Bell, ShieldCheck, User, Radio } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
          <Wind className="h-6 w-6 animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white">RüzgarGülü</h1>
            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 font-mono">
              v0.1.0-scaffold
            </span>
          </div>
          <p className="text-xs text-slate-400">Akıllı Rüzgâr Enerjisi & Saha Operasyonları</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Sistem Durumu */}
        <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-950/60 px-3 py-1.5 border border-slate-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-slate-300">
            Saha Durumu: <span className="font-semibold text-emerald-400">Canlı İzleme Hazır</span>
          </span>
        </div>

        {/* Bildirim Zili */}
        <button
          className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          title="Bildirimler"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        </button>

        {/* Kullanıcı Profili */}
        <div className="flex items-center gap-2.5 border-l border-slate-800 pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-white leading-tight">AKKA Soft Saha Ekibi</p>
            <p className="text-[10px] text-slate-400">Kıbrıs Türbin Parkı</p>
          </div>
        </div>
      </div>
    </header>
  );
};

