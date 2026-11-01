import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Sliders,
  Download,
  Info,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Award,
  Layers,
  Activity,
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
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import analyticsService from '../services/api/analyticsService.js';
import { useToast } from '../context/ToastContext.jsx';

export function Analytics() {
  const [evaluation, setEvaluation] = useState(null);
  const [summary, setSummary] = useState(null);
  const [threshold, setThreshold] = useState(60.0);
  const [loading, setLoading] = useState(true);
  const [evalLoading, setEvalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const toast = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, evalRes] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getConfusionMatrix(threshold),
      ]);
      setSummary(sumRes);
      setEvaluation(evalRes);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    loadData();

    const handleRefresh = () => loadData();
    window.addEventListener('ftads:refresh', handleRefresh);
    return () => window.removeEventListener('ftads:refresh', handleRefresh);
  }, [loadData]);

  // When threshold slider changes, update evaluation matrix
  const handleThresholdChange = async (newVal) => {
    setThreshold(newVal);
    setEvalLoading(true);
    try {
      const res = await analyticsService.getConfusionMatrix(newVal);
      setEvaluation(res);
    } catch (err) {
      toast.error(err.message || 'Failed to recompute metrics');
    } finally {
      setEvalLoading(false);
    }
  };

  const handleExport = async (type) => {
    setExporting(true);
    try {
      await analyticsService.downloadCsvExport(type, 1000);
      toast.success(`${type.toUpperCase()} report exported successfully.`);
    } catch (err) {
      toast.error(err.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} type="card" />
          ))}
        </div>
        <LoadingSkeleton type="chart" />
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="py-6">
        <ErrorBanner
          title="Error Loading Analytics"
          message={error.message}
          onRetry={loadData}
          isNetworkError={error.isNetworkError}
        />
      </div>
    );
  }

  const { confusionMatrix = {}, metrics = {} } = evaluation || {};
  const { tp = confusionMatrix.truePositives || 0, fp = confusionMatrix.falsePositives || 0, tn = confusionMatrix.trueNegatives || 0, fn = confusionMatrix.falseNegatives || 0 } = {};

  const riskBreakdown = summary?.detection?.riskBreakdown || [];
  const riskChartData = riskBreakdown.map((r) => ({
    name: r.risk_level,
    count: parseInt(r.count, 10),
    avgScore: parseFloat(r.avg_score || 0),
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Detection Analytics & Academic Evaluation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Statistical validation metrics, confusion matrix, and performance benchmarks against synthetic ground truth.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport('transactions')}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Transactions CSV</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport('alerts')}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Alerts CSV</span>
          </button>
        </div>
      </div>

      {/* Academic Ground-Truth Validation Banner */}
      <div className="bg-brand-50/70 border border-brand-200 rounded-xl p-4 text-xs text-brand-950 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Academic Evaluation Methodology:</p>
          <p className="text-brand-800 leading-relaxed">
            The confusion matrix and precision/recall metrics below evaluate the statistical detection engine
            against <strong>isolated synthetic ground-truth labels</strong> (`NORMAL` vs `SUSPICIOUS`) generated
            via reproducible Mulberry32 PRNG. The ground-truth labels had zero influence on the anomaly scoring engine.
          </p>
        </div>
      </div>

      {/* Academic KPI Metrics (Precision, Recall, F1, Accuracy) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Precision (PPV)"
          value={metrics.precisionPercent || '0.00%'}
          subtitle={`TP / (TP + FP) = ${tp} / ${tp + fp}`}
          icon={Award}
          variant="brand"
        />
        <KpiCard
          title="Recall / Sensitivity"
          value={metrics.recallPercent || '0.00%'}
          subtitle={`TP / (TP + FN) = ${tp} / ${tp + fn}`}
          icon={Activity}
          variant="success"
        />
        <KpiCard
          title="F1-Score (Harmonic Mean)"
          value={metrics.f1ScorePercent || '0.00%'}
          subtitle="Balance of precision & recall"
          icon={Layers}
          variant="brand"
        />
        <KpiCard
          title="Overall Accuracy"
          value={metrics.accuracyPercent || '0.00%'}
          subtitle={`(TP + TN) / Total = ${tp + tn} / ${tp + tn + fp + fn}`}
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Interactive Confusion Matrix Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Academic Confusion Matrix</h3>
            <p className="text-xs text-slate-500">
              Evaluated on {evaluation?.evaluationMetadata?.totalEvaluated || 0} transactions
            </p>
          </div>

          {/* Decision Threshold Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Decision Threshold:</span>
            <input
              type="range"
              min="30"
              max="80"
              step="5"
              value={threshold}
              onChange={(e) => handleThresholdChange(Number(e.target.value))}
              className="w-32 accent-brand-600 cursor-pointer"
            />
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              {threshold.toFixed(1)} / 100
            </span>
          </div>
        </div>

        {/* 2x2 Confusion Matrix Visual Grid */}
        <div className="max-w-2xl mx-auto my-4">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {/* Corner header */}
            <div className="p-3"></div>
            <div className="p-3 font-bold text-slate-700 bg-slate-100 rounded-lg">
              Predicted Normal (&lt; {threshold})
            </div>
            <div className="p-3 font-bold text-slate-700 bg-slate-100 rounded-lg">
              Predicted Suspicious (&ge; {threshold})
            </div>

            {/* Actual Normal Row */}
            <div className="p-3 font-bold text-slate-700 bg-slate-100 rounded-lg flex items-center justify-center">
              Actual Normal
            </div>
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col justify-center">
              <span className="text-xs text-emerald-800 font-semibold mb-1">True Negative (TN)</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-950">{tn}</span>
              <span className="text-[10px] text-emerald-700 mt-1">Accurately passed legitimate txn</span>
            </div>
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col justify-center">
              <span className="text-xs text-rose-800 font-semibold mb-1">False Positive (FP)</span>
              <span className="text-2xl font-extrabold font-mono text-rose-950">{fp}</span>
              <span className="text-[10px] text-rose-700 mt-1">Normal flagged as anomaly</span>
            </div>

            {/* Actual Suspicious Row */}
            <div className="p-3 font-bold text-slate-700 bg-slate-100 rounded-lg flex items-center justify-center">
              Actual Suspicious
            </div>
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col justify-center">
              <span className="text-xs text-amber-800 font-semibold mb-1">False Negative (FN)</span>
              <span className="text-2xl font-extrabold font-mono text-amber-950">{fn}</span>
              <span className="text-[10px] text-amber-700 mt-1">Suspicious missed by threshold</span>
            </div>
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col justify-center">
              <span className="text-xs text-emerald-800 font-semibold mb-1">True Positive (TP)</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-950">{tp}</span>
              <span className="text-[10px] text-emerald-700 mt-1">Correctly caught anomaly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Transactions by Risk Tier</h3>
          <p className="text-xs text-slate-500 mb-4">Volume count across evaluated risk classifications</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [val, 'Transactions']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Compliance Alert Status Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Case lifecycle state across generated alerts</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(summary?.alerts?.statusBreakdown || []).map((s) => ({
                  name: s.status.replace(/_/g, ' '),
                  count: parseInt(s.count, 10),
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [val, 'Alerts']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;

