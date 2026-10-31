import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  headerAction,
  title,
  subtitle,
}) => {
  return (
    <div
      className={`rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-slate-700/80 ${className}`}
    >
      {(title || headerAction) && (
        <div className="mb-4 flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div>
            {title && <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

