import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import KpiCard from '../components/common/KpiCard.jsx';
import RiskBadge from '../components/common/RiskBadge.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import dashboardService from '../services/api/dashboardService.js';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';

export function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await dashboardService.getDashboardSummary();
      setData(summary);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen to global refresh trigger from header
    const handleGlobalRefresh = () => loadData();
    window.addEventListener('ftads:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('ftads:refresh', handleGlobalRefresh);
  }, [loadData]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} type="card" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton type="chart" />
          <LoadingSkeleton type="chart" />
        </div>
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="py-6">
        <ErrorBanner
          title="Failed to Load Dashboard Data"
          message={error.message}
          onRetry={loadData}
          isNetworkError={error.isNetworkError}
        />
      </div>
    );
  }

  const { transactions, detection, alerts, recentAnomalies = [], activeOpenAlerts = [] } = data || {};

  // Extract risk tier counts
  const riskCounts = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  (detection?.riskBreakdown || []).forEach((item) => {
    riskCounts[item.risk_level] = parseInt(item.count, 10);
  });

  // Recharts: Channel volume data
  const channelData = (transactions?.channelDistribution || []).map((ch) => ({
    name: ch.transaction_channel,
    count: parseInt(ch.count, 10),
    volume: parseFloat(ch.total_volume || 0),
  }));

  // Recharts: Risk Distribution Data
  const riskPieData = [
    { name: 'Critical', value: riskCounts.CRITICAL, color: '#ef4444' },
    { name: 'High', value: riskCounts.HIGH, color: '#f97316' },
    { name: 'Medium', value: riskCounts.MEDIUM, color: '#f59e0b' },
    { name: 'Low', value: riskCounts.LOW, color: '#10b981' },
  ].filter((item) => item.value > 0);

  // Recharts: Alert Status Data
  const alertStatusData = (alerts?.statusBreakdown || []).map((st) => ({
    name: st.status.replace(/_/g, ' '),
    count: parseInt(st.count, 10),
  }));

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Security Intelligence Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time telemetry, statistical anomaly detections, and active security investigations.
          </p>
        </div>

        {/* Guided Demo Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/transactions?riskLevel=CRITICAL')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors shadow-xs"
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>Critical Spikes ({riskCounts.CRITICAL})</span>
          </button>
          <button
            onClick={() => navigate('/alerts?status=OPEN')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors shadow-xs"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-brand-600" />
            <span>Open Triage ({alerts?.total || 0})</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Transactions"
          value={transactions?.total?.toLocaleString()}
          subtitle={`${transactions?.unanalyzed || 0} pending analysis`}
          icon={CreditCard}
          variant="brand"
          onClick={() => navigate('/transactions')}
        />
        <KpiCard
          title="Analyzed Transactions"
          value={transactions?.analyzed?.toLocaleString()}
          subtitle={`${Math.round(((transactions?.analyzed || 0) / (transactions?.total || 1)) * 100)}% coverage`}
          icon={TrendingUp}
          variant="brand"
        />
        <KpiCard
          title="Open Alerts"
          value={alerts?.total?.toLocaleString()}
          subtitle="Awaiting analyst triage"
          icon={AlertTriangle}
          variant={alerts?.total > 0 ? 'critical' : 'brand'}
          onClick={() => navigate('/alerts')}
        />
        <KpiCard
          title="High-Risk Flags"
          value={riskCounts.HIGH.toLocaleString()}
          subtitle="Score range 60–79"
          icon={ShieldAlert}
          variant="high"
          onClick={() => navigate('/transactions?riskLevel=HIGH')}
        />
        <KpiCard
          title="Critical Flags"
          value={riskCounts.CRITICAL.toLocaleString()}
          subtitle="Score range 80–100"
          icon={Flame}
          variant="critical"
          onClick={() => navigate('/transactions?riskLevel=CRITICAL')}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Risk Level Breakdown</h3>
              <p className="text-xs text-slate-500">Evaluated transaction risk distribution</p>
            </div>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Avg: {detection?.averageAnomalyScore || 0}/100
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {riskPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} transactions`, name]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 font-mono">No analyzed data available</div>
            )}
          </div>
        </div>

        {/* Transaction Volume by Channel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Activity by Payment Channel</h3>
              <p className="text-xs text-slate-500">Transaction counts across banking channels</p>
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              View Explorer <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val, name) => [val, 'Transactions']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two-Column Tables Grid: Recent Suspicious Transactions & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Suspicious Transactions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Anomaly Detections</h3>
              <p className="text-xs text-slate-500">Transactions with elevated statistical deviations</p>
            </div>
            <button
              onClick={() => navigate('/transactions?riskLevel=HIGH')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              See all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-x-auto">
            {recentAnomalies.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/60 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5">Reference</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Risk Level</th>
                    <th className="px-4 py-2.5 text-right">Score</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAnomalies.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">
                        {tx.transaction_reference}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge level={tx.risk_level} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {tx.anomaly_score}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/investigation/${tx.transaction_id}`)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-md transition-colors"
                        >
                          Investigate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No recent anomaly evaluations found. Run batch detection to analyze transactions.
              </div>
            )}
          </div>
        </div>

        {/* Active Open Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Compliance Alerts</h3>
              <p className="text-xs text-slate-500">Security cases requiring analyst review</p>
            </div>
            <button
              onClick={() => navigate('/alerts?status=OPEN')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View alerts <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-x-auto">
            {activeOpenAlerts.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/60 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5">Alert ID</th>
                    <th className="px-4 py-2.5">Severity</th>
                    <th className="px-4 py-2.5">Transaction</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-center">Triage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeOpenAlerts.map((al) => (
                    <tr key={al.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {al.id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge level={al.severity} size="sm" />
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">
                        {al.transaction_reference || 'Txn'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={al.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/alerts?id=${al.id}`)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                All alerts resolved. No open compliance items pending triage.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
