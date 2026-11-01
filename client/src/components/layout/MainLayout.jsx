import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import Modal from '../common/Modal.jsx';
import healthService from '../../services/api/healthService.js';
import detectionService from '../../services/api/detectionService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Zap, AlertTriangle } from 'lucide-react';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState({ connected: false, loading: true });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchLimit, setBatchLimit] = useState(50);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  const toast = useToast();
  const location = useLocation();

  const checkHealth = useCallback(async () => {
    try {
      const res = await healthService.checkHealth();
      setSystemStatus({
        connected: res.data?.status === 'UP',
        database: res.data?.database?.database,
        version: res.data?.version,
        loading: false,
      });
    } catch {
      setSystemStatus({
        connected: false,
        loading: false,
      });
    }
  }, []);

  // Poll health every 30 seconds
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkHealth();
    // Dispatch custom refresh event that page hooks can listen to
    window.dispatchEvent(new CustomEvent('ftads:refresh'));
    setTimeout(() => {
      setIsRefreshing(false);
      toast.info('Telemetry data refreshed');
    }, 400);
  };

  const handleRunBatch = async () => {
    setIsBatchRunning(true);
    try {
      const res = await detectionService.analyzeBatch({
        limit: Number(batchLimit),
        onlyUnanalyzed: true,
      });
      toast.success(
        `Batch analysis complete: ${res.totalProcessed} transactions evaluated (${res.alertsTriggered} alerts triggered).`
      );
      setBatchModalOpen(false);
      handleRefresh();
    } catch (err) {
      toast.error(err.message || 'Batch detection execution failed');
    } finally {
      setIsBatchRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          systemStatus={systemStatus}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onTriggerBatch={() => setBatchModalOpen(true)}
        />

        {/* Global Connection Warning Banner if backend is offline */}
        {!systemStatus.connected && !systemStatus.loading && (
          <div className="bg-rose-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Backend Disconnected:</strong> Cannot reach FTADS API at{' '}
                <code className="bg-rose-700 px-1 py-0.5 rounded">
                  {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}
                </code>
                . Please run <code className="bg-rose-700 px-1 py-0.5 rounded">cd server && npm start</code>.
              </span>
            </div>
            <button
              onClick={checkHealth}
              className="px-2 py-0.5 bg-rose-700 hover:bg-rose-800 rounded text-[11px] font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Batch Analysis Quick Modal */}
      <Modal
        isOpen={batchModalOpen}
        onClose={() => !isBatchRunning && setBatchModalOpen(false)}
        title="Execute Batch Anomaly Detection"
        subtitle="Run statistical multi-signal engine over unanalyzed transactions"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            The batch detector will pull strictly prior historical context for each customer,
            compute Median Absolute Deviations (MAD), check rolling velocity windows, and automatically
            generate compliance alerts for scores exceeding threshold (&ge; 60.0).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Batch Size (Transaction Count)
            </label>
            <select
              value={batchLimit}
              onChange={(e) => setBatchLimit(Number(e.target.value))}
              disabled={isBatchRunning}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="25">25 Transactions</option>
              <option value="50">50 Transactions</option>
              <option value="100">100 Transactions</option>
              <option value="250">250 Transactions</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBatchModalOpen(false)}
              disabled={isBatchRunning}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRunBatch}
              disabled={isBatchRunning}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isBatchRunning ? 'animate-spin' : ''}`} />
              {isBatchRunning ? 'Analyzing...' : 'Start Batch Analysis'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MainLayout;

