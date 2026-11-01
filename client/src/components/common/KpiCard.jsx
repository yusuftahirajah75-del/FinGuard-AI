import React from 'react';

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'brand',
  loading = false,
  onClick,
  className = '',
}) {
  const variantStyles = {
    brand: {
      border: 'border-slate-200',
      iconBg: 'bg-brand-50 text-brand-600',
      accent: 'text-slate-900',
    },
    critical: {
      border: 'border-rose-200 bg-rose-50/20',
      iconBg: 'bg-rose-100 text-rose-600',
      accent: 'text-rose-700',
    },
    high: {
      border: 'border-orange-200 bg-orange-50/20',
      iconBg: 'bg-orange-100 text-orange-600',
      accent: 'text-orange-700',
    },
    medium: {
      border: 'border-amber-200 bg-amber-50/20',
      iconBg: 'bg-amber-100 text-amber-600',
      accent: 'text-amber-700',
    },
    success: {
      border: 'border-emerald-200 bg-emerald-50/20',
      iconBg: 'bg-emerald-100 text-emerald-600',
      accent: 'text-emerald-700',
    },
  };

  const style = variantStyles[variant] || variantStyles.brand;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
          <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-8 bg-slate-200 rounded w-16 my-2"></div>
        <div className="h-3 bg-slate-100 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${style.border} ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${style.iconBg}`} aria-hidden="true">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-2xl lg:text-3xl font-bold tracking-tight ${style.accent}`}>
          {value ?? '0'}
        </span>
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default KpiCard;
