import React from 'react';
import { AlertTriangle, RefreshCw, ServerOff } from 'lucide-react';

export function ErrorBanner({
  title = 'API Connection Error',
  message,
  onRetry,
  isNetworkError = false,
  className = '',
}) {
  return (
    <div
      className={`rounded-xl border border-rose-200 bg-rose-50/80 p-5 text-rose-900 shadow-sm ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
          {isNetworkError ? <ServerOff className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-semibold text-rose-900 mb-1">{title}</h4>
          <p className="text-xs text-rose-700 leading-relaxed mb-3">
            {message || 'Failed to communicate with FTADS backend service.'}
          </p>

          {isNetworkError && (
            <div className="text-xs bg-white/70 border border-rose-200/80 rounded-md p-3 mb-3 font-mono text-slate-700">
              <span className="font-semibold block text-slate-900 mb-1">Troubleshooting checklist:</span>
              1. Ensure backend is running: <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-800">cd server && npm start</code><br />
              2. Verify PostgreSQL service is active on port 5432.<br />
              3. Check <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-800">VITE_API_BASE_URL</code> points to <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-800">http://localhost:5000/api</code>.
            </div>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-white border border-rose-300 rounded-md hover:bg-rose-50 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorBanner;
