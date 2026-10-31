import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="h-16 w-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-emerald-400 mb-4 border border-slate-700">
        <Compass className="h-8 w-8" />
      </div>
      <h2 className="text-3xl font-bold text-white tracking-tight">404 - Sayfa Bulunamadı</h2>
      <p className="mt-2 text-sm text-slate-400 max-w-md">
        Aradığınız modül mevcut değil veya henüz yapılandırılmamış olabilir.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Genel Bakışa Dön
      </Link>
    </div>
  );
};

