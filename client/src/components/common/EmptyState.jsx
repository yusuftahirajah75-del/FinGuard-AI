import React from 'react';
import { AlertCircle } from 'lucide-react';

export function EmptyState({
  title = 'No records found',
  message = 'There are no items matching your criteria or currently available in the system.',
  icon: Icon = AlertCircle,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      <div className="p-3 bg-slate-100 text-slate-500 rounded-full mb-4" aria-hidden="true">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;

