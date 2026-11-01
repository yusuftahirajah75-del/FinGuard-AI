import React from 'react';

export function LoadingSkeleton({ type = 'table', rows = 5, className = '' }) {
  if (type === 'card') {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-2/3"></div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse ${className}`}>
        <div className="h-5 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-slate-100 rounded flex items-center justify-center">
          <div className="text-slate-400 text-xs font-mono">Loading telemetry visualization...</div>
        </div>
      </div>
    );
  }

  // Default: Table skeleton
  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-pulse ${className}`}>
      <div className="h-12 bg-slate-100 border-b border-slate-200 px-6 flex items-center gap-4">
        <div className="h-4 bg-slate-300 rounded w-28"></div>
        <div className="h-4 bg-slate-200 rounded w-24"></div>
        <div className="h-4 bg-slate-200 rounded w-20"></div>
        <div className="h-4 bg-slate-200 rounded w-32"></div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="h-4 bg-slate-200 rounded w-32"></div>
            <div className="h-4 bg-slate-100 rounded w-24"></div>
            <div className="h-4 bg-slate-200 rounded w-16"></div>
            <div className="h-4 bg-slate-100 rounded w-28"></div>
            <div className="h-6 bg-slate-200 rounded-full w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoadingSkeleton;

