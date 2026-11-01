import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Zap,
  ArrowLeft,
  AlertTriangle,
  Clock,
  Repeat,
  UserPlus,
  TrendingUp,
  CreditCard,
  FileText,
  CheckCircle2,
  ExternalLink,
  Info,
} from 'lucide-react';
import RiskBadge from '../components/common/RiskBadge.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import transactionService from '../services/api/transactionService.js';
import detectionService from '../services/api/detectionService.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';

export function Investigation() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [txInput, setTxInput] = useState('');

  const navigate = useNavigate();
  const toast = useToast();

  const loadData = useCallback(async (targetId) => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const tx = await transactionService.getTransactionById(targetId);
      setTransaction(tx);

      // Attempt to load existing detection result if analyzed
      try {
        const result = await detectionService.getResultsByTransactionId(targetId);
        setDetectionResult(result);
      } catch {
        // May not have been analyzed yet
        setDetectionResult(null);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      setTxInput(id);
      loadData(id);
    } else {
      setLoading(false);
    }
  }, [id, loadData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (txInput.trim()) {
      navigate(`/investigation/${txInput.trim()}`);
    }
  };

  const handleAnalyze = async () => {
    if (!transaction?.id) return;

    setAnalyzing(true);
    try {
      const analysis = await detectionService.analyzeTransaction(transaction.id);
      setDetectionResult(analysis);
      toast.success(
        `Transaction analyzed: Score ${analysis.anomalyScore}/100 (${analysis.riskLevel}). ${
          analysis.alertCreated ? 'Compliance alert generated.' : 'No alert triggered.'
        }`
      );
      // Reload transaction to update alert link state
      const updatedTx = await transactionService.getTransactionById(transaction.id);
      setTransaction(updatedTx);
    } catch (err) {
      toast.error(err.message || 'Failed to analyze transaction');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!id && !transaction) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Transaction Investigation Workbench</h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Input a transaction UUID to inspect individual anomaly signals, mathematical MAD deviations, and explainable justifications.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Paste Transaction UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
            value={txInput}
            onChange={(e) => setTxInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/50 shadow-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            Load Case
          </button>
        </form>

        <div className="pt-6 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={() => navigate('/transactions?riskLevel=CRITICAL')}
            className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
          >
            &larr; Or select a flagged record from Transaction Explorer
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-6 bg-slate-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" className="lg:col-span-2" />
        </div>
        <LoadingSkeleton type="table" rows={4} />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="space-y-6 py-6">
        <button
          onClick={() => navigate('/transactions')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Transactions
        </button>
        <ErrorBanner
          title="Transaction Not Found"
          message={error?.message || `Transaction with ID '${id}' could not be located.`}
          onRetry={() => loadData(id)}
        />
      </div>
    );
  }

  const score = (detectionResult?.anomaly_score ?? detectionResult?.anomalyScore) ?? transaction.anomaly_score;
  const riskLevel = (detectionResult?.risk_level ?? detectionResult?.riskLevel) ?? transaction.risk_level;
  const explanation = detectionResult?.explanation;
  const signals = (detectionResult?.signal_results ?? detectionResult?.signals) || {};
  const alertId = transaction.alert_id || detectionResult?.alert?.id;

  return (
    <div className="space-y-6">
      {/* Navigation and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-mono tracking-tight">
                {transaction.transaction_reference}
              </h1>
              {riskLevel && <RiskBadge level={riskLevel} size="sm" />}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Case ID: <span className="font-mono text-slate-700">{transaction.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {alertId && (
            <button
              onClick={() => navigate(`/alerts?id=${alertId}`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>View Compliance Alert</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analyzing with Engine...' : score !== null ? 'Re-Analyze Transaction' : 'Analyze Transaction'}
          </button>
        </div>
      </div>

      {/* Top Split: Metadata Overview & Anomaly Score Gauge Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomaly Score Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Anomaly Score
              </span>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Engine v{detectionResult?.algorithm_version || detectionResult?.algorithmVersion || '1.0.0'}
              </span>
            </div>

            {/* Score Numerical & Progress Bar */}
            <div className="my-4 text-center">
              <div className="text-5xl font-extrabold font-mono tracking-tight text-slate-900">
                {score !== null && score !== undefined ? Number(score).toFixed(1) : '—'}
                <span className="text-lg font-normal text-slate-400"> / 100</span>
              </div>
              <div className="mt-3">
                {riskLevel ? (
                  <RiskBadge level={riskLevel} size="lg" />
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Evaluation Pending</span>
                )}
              </div>
            </div>

            {/* Visual Gauge Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-6 mb-2">
              <div
                className={`h-full transition-all duration-500 ${
                  Number(score) >= 80
                    ? 'bg-rose-500'
                    : Number(score) >= 60
                    ? 'bg-orange-500'
                    : Number(score) >= 30
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, Number(score || 0)))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0 (Low)</span>
              <span>30 (Med)</span>
              <span>60 (High)</span>
              <span>80 (Crit)</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
            {score >= 60 ? (
              <span className="text-rose-700 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Compliance threshold exceeded (&ge; 60.0). Case automatically elevated to compliance queue.
              </span>
            ) : score !== null && score !== undefined ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Transaction within customary statistical bounds. Straight-Through Processing permitted.
              </span>
            ) : (
              <span>Click "Analyze Transaction" above to evaluate against customer baseline.</span>
            )}
          </div>
        </div>

        {/* Transaction Telemetry Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              Transaction Telemetry Record
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block mb-1">Amount</span>
                <span className="text-base font-bold text-slate-900">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block mb-1">Channel</span>
                <span className="text-xs font-semibold text-slate-800 font-mono">
                  {transaction.transaction_channel}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block mb-1">Type</span>
                <span className="text-xs font-semibold text-slate-800 font-mono">
                  {transaction.transaction_type}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block mb-1">Status</span>
                <span className="text-xs font-semibold text-slate-800">
                  {transaction.transaction_status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Customer Reference:</span>
                  <span className="font-mono font-semibold text-slate-900">{transaction.customer_reference}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Source Account:</span>
                  <span className="font-mono text-slate-800">{transaction.source_account_reference}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Beneficiary:</span>
                  <span className="font-mono font-semibold text-brand-700">{transaction.beneficiary_reference}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="font-mono text-slate-800">{formatDateTime(transaction.transaction_timestamp)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-800">{transaction.transaction_location || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Academic Ground Truth:</span>
                  <span className="font-mono font-semibold px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                    {transaction.synthetic_ground_truth_label || 'NORMAL'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Ground-Truth Isolation Disclaimer */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Ground-truth labels are isolated exclusively for academic validation benchmarks and never influence statistical scoring.
            </span>
          </div>
        </div>
      </div>

      {/* Synthesized Natural Language Explanation */}
      {explanation && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            Statistical Detection Narrative
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/80 p-4 rounded-lg border border-slate-100">
            {explanation}
          </p>
        </div>
      )}

      {/* 5 Explainable Detection Signals Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900">Multi-Signal Statistical Breakdown</h3>
          <p className="text-xs text-slate-500">Individual detector contributions to composite anomaly score</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Signal 1: Amount Anomaly */}
          <SignalCard
            title="Amount Deviation"
            weight="35%"
            icon={TrendingUp}
            signal={signals.amount}
            defaultMetricDesc="Robust Modified Z-Score based on customer historical median & MAD"
          />

          {/* Signal 2: Velocity Burst */}
          <SignalCard
            title="Velocity Burst"
            weight="25%"
            icon={Zap}
            signal={signals.velocity}
            defaultMetricDesc="Rolling 5-minute (burst &ge; 3) & 1-hour (burst &ge; 8) counters"
          />

          {/* Signal 3: Unusual Time */}
          <SignalCard
            title="Circadian Time"
            weight="15%"
            icon={Clock}
            signal={signals.unusual_time}
            defaultMetricDesc="Customer empirical hourly active probability distribution"
          />

          {/* Signal 4: Repeated Transaction */}
          <SignalCard
            title="Repeated Transfer"
            weight="15%"
            icon={Repeat}
            signal={signals.repeated_transaction}
            defaultMetricDesc="Identical amount (&plusmn;1%) & beneficiary within 30 minutes"
          />

          {/* Signal 5: New Beneficiary */}
          <SignalCard
            title="New Counterparty"
            weight="10%"
            icon={UserPlus}
            signal={signals.new_beneficiary}
            defaultMetricDesc="Previously unseen recipient novelty indicator"
          />
        </div>
      </div>
    </div>
  );
}

// Sub-component for individual signal rendering
function SignalCard({ title, weight, icon: Icon, signal, defaultMetricDesc }) {
  if (!signal) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-400 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">{title}</span>
          <span className="font-mono text-[10px]">{weight}</span>
        </div>
        <p className="text-[11px]">Evaluation pending execution.</p>
      </div>
    );
  }

  const isTriggered = signal.triggered;
  const isAvailable = signal.status !== 'UNAVAILABLE' && signal.signalAvailable !== false;

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        !isAvailable
          ? 'bg-slate-50/70 border-slate-200 text-slate-500'
          : isTriggered
          ? 'bg-rose-50/30 border-rose-200'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-md ${
              isTriggered ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">{title}</h4>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-slate-400">Weight:</span>
          <span className="font-semibold text-slate-700">{weight}</span>
        </div>
      </div>

      <div className="flex items-baseline justify-between my-2">
        <span className="text-[11px] text-slate-500">
          Sub-Score: <strong className="font-mono text-slate-800">{signal.rawScore || 0}/100</strong>
        </span>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            !isAvailable
              ? 'bg-slate-100 text-slate-500'
              : isTriggered
              ? 'bg-rose-100 text-rose-800 font-bold'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {!isAvailable ? 'Unavailable' : isTriggered ? 'Flagged Deviation' : 'Nominal'}
        </span>
      </div>

      <p className="text-[11px] text-slate-600 leading-relaxed mt-2 pt-2 border-t border-slate-100">
        {signal.explanation || defaultMetricDesc}
      </p>

      {signal.contribution !== undefined && isAvailable && (
        <div className="mt-2 text-[10px] font-mono text-slate-400 text-right">
          Effective Score Contrib: +{signal.contribution} pts
        </div>
      )}
    </div>
  );
}

export default Investigation;
