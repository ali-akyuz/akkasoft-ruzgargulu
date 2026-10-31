import React from 'react';
import { Construction, ArrowRight, GitCommit } from 'lucide-react';

interface FeaturePlaceholderProps {
  featureName: string;
  badge?: string;
  description: string;
  plannedCapabilities?: string[];
}

export const FeaturePlaceholder: React.FC<FeaturePlaceholderProps> = ({
  featureName,
  badge = 'Geliştirme Aşamasında',
  description,
  plannedCapabilities = [],
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 md:p-8 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Construction className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                {badge}
              </span>
            </div>
            <h3 className="mt-2 text-xl font-bold text-white tracking-tight">{featureName}</h3>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl leading-relaxed">{description}</p>
          </div>
        </div>
      </div>

      {plannedCapabilities.length > 0 && (
        <div className="mt-6 border-t border-amber-500/20 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Planlanan Modül Yetenekleri:
          </p>
          <ul className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-300">
            {plannedCapabilities.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

