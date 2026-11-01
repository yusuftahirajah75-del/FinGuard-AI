import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders,
  Cpu,
  BookOpen,
  TrendingUp,
  Zap,
  Clock,
  Repeat,
  UserPlus,
  AlertTriangle,
  RotateCcw,
  Save,
  CheckCircle2,
  Info,
} from 'lucide-react';
import detectionService from '../services/api/detectionService.js';
import ConfirmationDialog from '../components/common/ConfirmationDialog.jsx';
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function Methodology() {
  const [methodology, setMethodology] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Editable settings state
  const [weights, setWeights] = useState({
    amount: 0.35,
    velocity: 0.25,
    unusual_time: 0.15,
    repeated_transaction: 0.15,
    new_beneficiary: 0.10,
  });
  const [alertThreshold, setAlertThreshold] = useState(60.0);

  // Demo Reseed Modal State
  const [reseedModalOpen, setReseedModalOpen] = useState(false);

  const toast = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [methodRes, settingsRes] = await Promise.all([
        detectionService.getMethodology(),
        detectionService.getSettings(),
      ]);
      setMethodology(methodRes);
      setSettings(settingsRes);
      if (settingsRes?.weights) {
        setWeights(settingsRes.weights);
      }
      if (settingsRes?.thresholds?.alert_trigger_score !== undefined) {
        setAlertThreshold(settingsRes.thresholds.alert_trigger_score);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute weight sum
  const weightSum = Object.values(weights).reduce((a, b) => a + Number(b), 0);
  const isWeightValid = Math.abs(weightSum - 1.0) < 0.001;

  const handleWeightChange = (key, val) => {
    setWeights((prev) => ({
      ...prev,
      [key]: parseFloat(val) || 0,
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!isWeightValid) {
      toast.error(`Weights must sum to 1.0 (currently ${(weightSum * 100).toFixed(1)}%)`);
      return;
    }

    setSaving(true);
    try {
      await detectionService.updateSettings({
        weights,
        thresholds: {
          ...settings?.thresholds,
          alert_trigger_score: Number(alertThreshold),
        },
        description: 'Tuned by compliance administrator via FTADS interface',
      });
      toast.success('Detection engine weights and thresholds successfully saved.');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !methodology) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
        </div>
      </div>
    );
  }

  if (error && !methodology) {
    return (
      <div className="py-6">
        <ErrorBanner
          title="Failed to Load Detection Methodology"
          message={error.message}
          onRetry={loadData}
          isNetworkError={error.isNetworkError}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Detection Methodology & Engine Tuning
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Mathematical formulations, explainable statistical rules, and runtime parameter configuration.
        </p>
      </div>

      {/* Mandatory Academic Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-950">Mandatory Academic & Compliance Disclaimer:</p>
          <p className="leading-relaxed font-medium">
            "An anomaly score indicates unusual transaction behaviour requiring further investigation.
            It does not establish that a transaction is fraudulent."
          </p>
        </div>
      </div>

      {/* 5 Detectors In-Depth Specifications Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-600" />
          Statistical Detectors Technical Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Amount Detector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-600" />
                1. Amount Anomaly Detector
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold">
                Nominal: 35%
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Standard parametric standard deviation is heavily compromised by financial fraud outliers.
              FTADS calculates the <strong>Median Absolute Deviation (MAD)</strong>:
            </p>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg font-mono text-[11px] text-slate-800">
              MAD = median(|x_i - median(X)|)<br />
              Modified Z = 0.6745 * (Amount - Median) / MAD
            </div>
            <p className="text-slate-500 text-[11px]">
              <strong>Zero MAD Fallback:</strong> If all prior transactions have identical amounts (MAD = 0),
              the engine transitions to Mean Absolute Deviation or relative ratio multipliers.
            </p>
          </div>

          {/* Velocity Detector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-600" />
                2. Transaction Velocity Detector
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold">
                Nominal: 25%
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Evaluates transaction frequency within dual sliding temporal windows to distinguish human operations
              from automated bot attacks:
            </p>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg font-mono text-[11px] text-slate-800">
              5-Minute Window: Threshold &ge; 3 transactions<br />
              1-Hour Window: Threshold &ge; 8 transactions
            </div>
            <p className="text-slate-500 text-[11px]">
              Exceeding the 5-minute threshold reflects high urgency (card stuffing scripts or rapid drainage).
            </p>
          </div>

          {/* Unusual Time Detector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                3. Unusual Transaction Time Detector
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold">
                Nominal: 15%
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Builds a circadian histogram across customer prior activity. Flags nocturnal transactions
              occurring during habitual sleep hours:
            </p>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg font-mono text-[11px] text-slate-800">
              P(Hour) &lt; 0.05 AND Window_P(Hour &plusmn; 1h) &lt; 0.05
            </div>
            <p className="text-slate-500 text-[11px]">
              Minimum 5 past transactions required to model diurnal baseline. Otherwise marked UNAVAILABLE.
            </p>
          </div>

          {/* Repeated Transaction Detector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <Repeat className="w-4 h-4 text-brand-600" />
                4. Repeated Transaction Detector
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold">
                Nominal: 15%
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Catches duplicate charges, replay attacks, or rapid retry scripts:
            </p>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg font-mono text-[11px] text-slate-800">
              Customer_Match AND Beneficiary_Match<br />
              |Amount_1 - Amount_2| / Amount_1 &le; 1.0% (Window &le; 30m)
            </div>
            <p className="text-slate-500 text-[11px]">
              The transaction is strictly excluded from comparing against itself.
            </p>
          </div>

          {/* New Beneficiary Detector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-600" />
                5. New Beneficiary Detector
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold">
                Nominal: 10%
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Detects transfers to previously unseen counterparties. In accordance with banking ethics,
              <strong> a new recipient alone is NEVER declared fraudulent</strong>:
            </p>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg font-mono text-[11px] text-slate-800">
              Beneficiary NOT IN Customer_Historical_Beneficiaries =&gt; Novelty Score = 45.0 (Weight 10%)
            </div>
          </div>
        </div>
      </div>

      {/* Proportional Normalization Formula Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs">
        <h3 className="text-sm font-bold text-slate-900">Missing-Signal Proportional Normalization</h3>
        <p className="text-slate-600 leading-relaxed">
          When a customer has limited history (&lt; 3 transactions for amount, &lt; 5 for time), those signals are marked
          `UNAVAILABLE`. The composite anomaly score is proportionally normalized across available indicators:
        </p>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 font-mono text-center text-xs text-slate-900 font-bold">
          Anomaly Score = (&sum; Available_Weight_i &times; Score_i) / (&sum; Available_Weights)
        </div>
      </div>

      {/* Risk Classification Bands */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Risk Classification Bands</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
            <span className="font-bold text-emerald-800 block text-sm">LOW RISK</span>
            <span className="font-mono text-xs text-emerald-700 font-bold">0.00 – 29.99</span>
            <p className="text-[10px] text-emerald-600 mt-1">Normal straight-through operation</p>
          </div>
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
            <span className="font-bold text-amber-800 block text-sm">MEDIUM RISK</span>
            <span className="font-mono text-xs text-amber-700 font-bold">30.00 – 59.99</span>
            <p className="text-[10px] text-amber-600 mt-1">Elevated activity observation</p>
          </div>
          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/60">
            <span className="font-bold text-orange-800 block text-sm">HIGH RISK</span>
            <span className="font-mono text-xs text-orange-700 font-bold">60.00 – 79.99</span>
            <p className="text-[10px] text-orange-600 mt-1">Auto-generates Compliance Alert</p>
          </div>
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60">
            <span className="font-bold text-rose-800 block text-sm">CRITICAL RISK</span>
            <span className="font-mono text-xs text-rose-700 font-bold">80.00 – 100.00</span>
            <p className="text-[10px] text-rose-600 mt-1">Immediate freeze & mandatory review</p>
          </div>
        </div>
      </div>

      {/* Interactive Settings Editor (Form) */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-600" />
              Runtime Engine Parameter Configuration
            </h3>
            <p className="text-xs text-slate-500">Tune statistical detector weights and compliance alert thresholds</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Total Weights Sum:</span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded ${
                isWeightValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {(weightSum * 100).toFixed(1)}% {isWeightValid ? '✓' : '(Must equal 100%)'}
            </span>
          </div>
        </div>

        {/* Weights Sliders/Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Amount Anomaly Weight
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={weights.amount}
              onChange={(e) => handleWeightChange('amount', e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Velocity Burst Weight
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={weights.velocity}
              onChange={(e) => handleWeightChange('velocity', e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Unusual Time Weight
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={weights.unusual_time}
              onChange={(e) => handleWeightChange('unusual_time', e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Repeated Transaction Weight
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={weights.repeated_transaction}
              onChange={(e) => handleWeightChange('repeated_transaction', e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              New Beneficiary Weight
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={weights.new_beneficiary}
              onChange={(e) => handleWeightChange('new_beneficiary', e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alert Trigger Threshold (Score)
            </label>
            <input
              type="number"
              step="1"
              min="20"
              max="95"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving || !isWeightValid}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Updating Database...' : 'Save Engine Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Methodology;

