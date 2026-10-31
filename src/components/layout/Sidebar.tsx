import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  AlertTriangle,
  GitBranch,
  Layers,
} from 'lucide-react';
import { NavItem } from '../../types/navigation';

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Genel Bakış', path: '/', icon: LayoutDashboard },
  { id: 'analytics', label: 'Enerji Analizi', path: '/analytics', icon: BarChart3, badge: 'Yakında' },
  { id: 'faults', label: 'Arıza Kontrol', path: '/faults', icon: AlertTriangle, badge: 'Yakında' },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-slate-900/40 p-4 flex flex-col justify-between select-none">
      <div className="space-y-6">
        {/* Navigasyon Başlığı */}
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Saha Modülleri
          </p>
          <nav className="mt-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700/60 font-mono">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Mimari Bilgi Kartı */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Layers className="h-4 w-4 text-emerald-400" />
            <span>Mimarî Standart</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
            Katmanlı servis ve telemetri altyapısına hazır modüler ön yüz mimarisi.
          </p>
        </div>
      </div>

      {/* Operasyonel Durum Bilgisi */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-3.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
            Saha Hattı
          </span>
          <span className="text-xs font-mono font-bold text-emerald-400">Çevrimiçi</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
          Kuzey Kıbrıs 19 türbinlik santral ağı veri toplama altyapısı aktif.
        </p>
      </div>
    </aside>
  );
};

