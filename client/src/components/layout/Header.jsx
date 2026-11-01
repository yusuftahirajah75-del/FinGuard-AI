import React from 'react';
import { Menu, RefreshCw, Zap, Database, CheckCircle, XCircle } from 'lucide-react';

export function Header({
  onToggleSidebar,
  systemStatus,
  onRefresh,
  isRefreshing,
  onTriggerBatch,
}) {
  const isUp = systemStatus?.connected;

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono hidden sm:inline">
            WORKSPACE
          </span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <h2 className="text-sm font-semibold text-slate-900 truncate">
            Financial Transaction Security Dashboard
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Synthetic Dataset Academic Notice */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span>Synthetic Dataset (~1k Txns)</span>
        </div>

        {/* Backend Connectivity Beacon */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isUp
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
          title={isUp ? `Connected to ${systemStatus?.database || 'PostgreSQL'}` : 'Backend service unreachable'}
        >
          {isUp ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">Engine Live</span>
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Batch Analyze Quick Action */}
        {onTriggerBatch && (
          <button
            type="button"
            onClick={onTriggerBatch}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 transition-colors shadow-xs"
            title="Execute batch anomaly detection on unanalyzed transactions"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Batch Analyze</span>
          </button>
        )}

        {/* Manual Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Refresh active dataset"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
