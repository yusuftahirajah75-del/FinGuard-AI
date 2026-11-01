import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldCheck,
  User,
  Clock,
  History,
  Send,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle,
  FileText,
  X,
  Search,
} from 'lucide-react';
import RiskBadge from '../components/common/RiskBadge.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import alertService from '../services/api/alertService.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';

const STATUS_TABS = [
  { id: '', label: 'All Cases' },
  { id: 'OPEN', label: 'Open' },
  { id: 'UNDER_REVIEW', label: 'Under Review' },
  { id: 'RESOLVED', label: 'Resolved' },
  { id: 'FALSE_POSITIVE', label: 'False Positive' },
];

export function Alerts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Alert for Details Drawer
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form states inside detail drawer
  const [assignedAnalyst, setAssignedAnalyst] = useState('');
  const [investigationNotes, setInvestigationNotes] = useState('');

  const navigate = useNavigate();
  const toast = useToast();

  const currentStatus = searchParams.get('status') || '';
  const currentSeverity = searchParams.get('severity') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const selectedIdFromUrl = searchParams.get('id');

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20,
        ...(currentStatus ? { status: currentStatus } : {}),
        ...(currentSeverity ? { severity: currentSeverity } : {}),
      };

      const res = await alertService.getAlerts(params);
      setAlerts(res.items);
      setPagination(res.pagination);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, currentStatus, currentSeverity]);

  useEffect(() => {
    loadAlerts();

    const handleRefresh = () => loadAlerts();
    window.addEventListener('ftads:refresh', handleRefresh);
    return () => window.removeEventListener('ftads:refresh', handleRefresh);
  }, [loadAlerts]);

  // Open alert details if requested in URL or clicked
  const openAlertDetail = useCallback(async (alertId) => {
    setLoadingDetails(true);
    try {
      const detail = await alertService.getAlertById(alertId);
      setSelectedAlert(detail);
      setAssignedAnalyst(detail.assigned_analyst || '');
      setInvestigationNotes(detail.investigation_notes || '');
    } catch (err) {
      toast.error(err.message || 'Failed to load alert details');
    } finally {
      setLoadingDetails(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedIdFromUrl) {
      openAlertDetail(selectedIdFromUrl);
    }
  }, [selectedIdFromUrl, openAlertDetail]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedAlert?.id) return;
    setUpdating(true);
    try {
      const updated = await alertService.updateAlert(selectedAlert.id, {
        status: newStatus,
        assigned_analyst: assignedAnalyst,
        investigation_notes: investigationNotes,
        actor_reference: 'analyst-current',
      });
      toast.success(`Alert status changed to ${newStatus}`);
      await openAlertDetail(selectedAlert.id);
      loadAlerts();
    } catch (err) {
      toast.error(err.message || 'Failed to update alert');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedAlert?.id) return;
    setUpdating(true);
    try {
      await alertService.updateAlert(selectedAlert.id, {
        assigned_analyst: assignedAnalyst,
        investigation_notes: investigationNotes,
        actor_reference: 'analyst-current',
      });
      toast.success('Investigation notes updated successfully.');
      await openAlertDetail(selectedAlert.id);
      loadAlerts();
    } catch (err) {
      toast.error(err.message || 'Failed to save notes');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Compliance Case Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review, investigate, assign, and resolve flagged suspicious financial transactions.
          </p>
        </div>
      </div>

      {/* Status Filter Tabs & Severity Dropdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => updateParam('status', tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                currentStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Severity:</span>
          <select
            value={currentSeverity}
            onChange={(e) => updateParam('severity', e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Main Alerts Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={8} />
      ) : error ? (
        <ErrorBanner
          title="Error Loading Alerts"
          message={error.message}
          onRetry={loadAlerts}
          isNetworkError={error.isNetworkError}
        />
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No Alerts Found"
          message={
            currentStatus
              ? `There are no compliance alerts currently in '${currentStatus}' status.`
              : 'No compliance cases currently match the selected severity and filters.'
          }
          actionLabel="Clear Filters"
          onAction={() => setSearchParams(new URLSearchParams())}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Alert ID</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Analyst</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((al) => (
                  <tr
                    key={al.id}
                    onClick={() => openAlertDetail(al.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {al.id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3.5">
                      <RiskBadge level={al.severity} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-900">
                      {al.transaction_reference}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {formatCurrency(al.amount, al.currency)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                      {al.anomaly_score}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={al.status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {al.assigned_analyst || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {formatDateTime(al.created_at)}
                    </td>
                    <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openAlertDetail(al.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-md transition-colors shadow-2xs"
                      >
                        Triage Case
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{(page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{pagination.total}</span> alerts
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateParam('page', String(page - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono text-xs px-2">
                Page {page} of {pagination.totalPages || 1}
              </span>

              <button
                type="button"
                onClick={() => updateParam('page', String(page + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Alert Detail & Triage Drawer */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedAlert(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-xl bg-white shadow-2xl z-10 flex flex-col h-full border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 font-mono">
                    Case {selectedAlert.id.substring(0, 8)}
                  </h3>
                  <RiskBadge level={selectedAlert.severity} size="sm" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Associated Transaction: <strong className="font-mono text-slate-800">{selectedAlert.transaction_reference}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Transaction Key Metrics */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-0.5">Transaction Amount</span>
                  <span className="text-base font-bold text-slate-900">
                    {formatCurrency(selectedAlert.amount, selectedAlert.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Anomaly Score</span>
                  <span className="text-base font-extrabold font-mono text-slate-900">
                    {selectedAlert.anomaly_score} / 100
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Customer Reference</span>
                  <span className="font-mono font-medium text-slate-800">{selectedAlert.customer_reference}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Beneficiary</span>
                  <span className="font-mono font-medium text-slate-800">{selectedAlert.beneficiary_reference}</span>
                </div>
              </div>

              {/* Link to Full Investigation */}
              <button
                type="button"
                onClick={() => navigate(`/investigation/${selectedAlert.transaction_id}`)}
                className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-lg border border-brand-200 bg-brand-50 text-brand-700 font-semibold hover:bg-brand-100 transition-colors"
              >
                <span>Inspect Full Statistical Signal Matrix</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              {/* Status Transition Action Bar */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Update Case Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange('OPEN')}
                    disabled={updating || selectedAlert.status === 'OPEN'}
                    className={`p-2 rounded-lg text-center font-semibold border transition-all ${
                      selectedAlert.status === 'OPEN'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('UNDER_REVIEW')}
                    disabled={updating || selectedAlert.status === 'UNDER_REVIEW'}
                    className={`p-2 rounded-lg text-center font-semibold border transition-all ${
                      selectedAlert.status === 'UNDER_REVIEW'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Reviewing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('RESOLVED')}
                    disabled={updating || selectedAlert.status === 'RESOLVED'}
                    className={`p-2 rounded-lg text-center font-semibold border transition-all ${
                      selectedAlert.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Resolved
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('FALSE_POSITIVE')}
                    disabled={updating || selectedAlert.status === 'FALSE_POSITIVE'}
                    className={`p-2 rounded-lg text-center font-semibold border transition-all ${
                      selectedAlert.status === 'FALSE_POSITIVE'
                        ? 'bg-slate-100 text-slate-800 border-slate-400 ring-2 ring-slate-400/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    False Pos.
                  </button>
                </div>
              </div>

              {/* Assigned Analyst & Notes Editor */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Assigned Analyst
                  </label>
                  <input
                    type="text"
                    value={assignedAnalyst}
                    onChange={(e) => setAssignedAnalyst(e.target.value)}
                    placeholder="e.g. Senior Analyst Sarah Jenkins"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Investigation Notes & Case Findings
                  </label>
                  <textarea
                    rows={4}
                    value={investigationNotes}
                    onChange={(e) => setInvestigationNotes(e.target.value)}
                    placeholder="Record notes on out-of-band cardholder communications, IP verification, or fraud disposition..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/50 leading-relaxed font-sans"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={updating}
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs disabled:opacity-50"
                >
                  {updating ? 'Saving Changes...' : 'Save Notes & Case Assignment'}
                </button>
              </div>

              {/* Complete Audit Log History Timeline */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-brand-600" />
                  Compliance Audit Trail ({selectedAlert.auditLogs?.length || 0} entries)
                </h4>

                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
                  {selectedAlert.auditLogs && selectedAlert.auditLogs.length > 0 ? (
                    selectedAlert.auditLogs.map((log) => (
                      <div key={log.id} className="relative flex items-start gap-3 pl-7">
                        <div className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-brand-500"></div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-900 font-mono text-[11px]">
                              {log.action}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatDateTime(log.created_at)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Actor: <span className="font-mono text-slate-800 font-medium">{log.actor_reference}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic text-center py-4">
                      No audit history entries recorded.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Alerts;

