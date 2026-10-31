import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-900/40 px-6 py-3.5 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-300">RüzgarGülü</span>
        <span>•</span>
        <span>Kuzey Kıbrıs 19 Türbin Saha Kontrol ve İzleme Sistemi</span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-400">
        <span>Sistem Sürümü: <strong className="text-slate-300 font-mono">v0.1.0</strong></span>
        <span>•</span>
        <span className="text-emerald-400">Tüm Servisler Normal</span>
      </div>
    </footer>
  );
};

