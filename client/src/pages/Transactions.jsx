import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  CreditCard,
  Download,
  AlertCircle,
} from 'lucide-react';
import RiskBadge from '../components/common/RiskBadge.jsx';
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';
import transactionService from '../services/api/transactionService.js';
import analyticsService from '../services/api/analyticsService.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';

// Zod schema for new transaction submission
const newTransactionSchema = z.object({
  customer_reference: z.string().min(3, 'Customer reference is required (e.g. CUST-0099)'),
  source_account_reference: z.string().min(3, 'Source account is required (e.g. ACC-0099-01)'),
  beneficiary_reference: z.string().min(3, 'Beneficiary reference is required (e.g. BEN-9921)'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  currency: z.string().default('USD'),
  transaction_type: z.enum(['TRANSFER', 'PAYMENT', 'WITHDRAWAL', 'DEPOSIT']),
  transaction_channel: z.enum(['ONLINE', 'MOBILE', 'ATM', 'POS', 'BRANCH']),
  transaction_location: z.string().optional(),
  transaction_status: z.enum(['COMPLETED', 'PENDING', 'FAILED', 'FLAGGED']).default('COMPLETED'),
});

export function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  // Filters state from URL query params
  const search = searchParams.get('search') || '';
  const channel = searchParams.get('channel') || '';
  const status = searchParams.get('status') || '';
  const riskLevel = searchParams.get('riskLevel') || '';
  const minAmount = searchParams.get('minAmount') || '';
  const maxAmount = searchParams.get('maxAmount') || '';
  const sortBy = searchParams.get('sortBy') || 'timestamp';
  const sortOrder = searchParams.get('sortOrder') || 'DESC';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Load transactions
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20,
        sortBy,
        sortOrder,
        ...(search ? { search } : {}),
        ...(channel ? { channel } : {}),
        ...(status ? { status } : {}),
        ...(riskLevel ? { riskLevel } : {}),
        ...(minAmount ? { minAmount: Number(minAmount) } : {}),
        ...(maxAmount ? { maxAmount: Number(maxAmount) } : {}),
      };

      const res = await transactionService.getTransactions(params);
      setTransactions(res.items);
      setPagination(res.pagination);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, channel, status, riskLevel, minAmount, maxAmount, sortBy, sortOrder]);

  useEffect(() => {
    loadTransactions();

    const handleRefresh = () => loadTransactions();
    window.addEventListener('ftads:refresh', handleRefresh);
    return () => window.removeEventListener('ftads:refresh', handleRefresh);
  }, [loadTransactions]);

  // Update query params helper
  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // reset to page 1 on filter change
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Form handling for creating new transaction
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(newTransactionSchema),
    defaultValues: {
      customer_reference: 'CUST-0025',
      source_account_reference: 'ACC-0025-01',
      beneficiary_reference: 'BEN-NEW-PAYEE',
      amount: 4500.00,
      currency: 'USD',
      transaction_type: 'TRANSFER',
      transaction_channel: 'ONLINE',
      transaction_location: 'New York, US',
      transaction_status: 'COMPLETED',
    },
  });

  const onSubmitTransaction = async (formData) => {
    try {
      const created = await transactionService.createTransaction(formData);
      toast.success(`Transaction ${created.transaction_reference} recorded successfully.`);
      setCreateModalOpen(false);
      reset();
      loadTransactions();
      // Optional: Ask if user wants to immediately analyze it
      navigate(`/investigation/${created.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to record transaction');
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await analyticsService.downloadCsvExport('transactions', 1000);
      toast.success('CSV transaction report downloaded successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to download CSV export');
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters = Boolean(search || channel || status || riskLevel || minAmount || maxAmount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Transaction Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, filter, inspect, and evaluate financial transaction telemetry records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search reference, customer, beneficiary..."
              value={search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskLevel}
              onChange={(e) => updateFilter('riskLevel', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="">All Risk Tiers</option>
              <option value="CRITICAL">Critical (80–100)</option>
              <option value="HIGH">High (60–79)</option>
              <option value="MEDIUM">Medium (30–59)</option>
              <option value="LOW">Low (0–29)</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div>
            <select
              value={channel}
              onChange={(e) => updateFilter('channel', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="">All Channels</option>
              <option value="ONLINE">Online</option>
              <option value="MOBILE">Mobile</option>
              <option value="ATM">ATM</option>
              <option value="POS">POS / Merchant</option>
              <option value="BRANCH">Branch</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="timestamp">Sort: Timestamp</option>
              <option value="amount">Sort: Amount</option>
              <option value="score">Sort: Anomaly Score</option>
              <option value="reference">Sort: Reference</option>
            </select>

            <button
              type="button"
              onClick={() => updateFilter('sortOrder', sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
              title={`Sorting: ${sortOrder}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Amount range and reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Amount:</span>
            <input
              type="number"
              placeholder="Min $"
              value={minAmount}
              onChange={(e) => updateFilter('minAmount', e.target.value)}
              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="number"
              placeholder="Max $"
              value={maxAmount}
              onChange={(e) => updateFilter('maxAmount', e.target.value)}
              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <LoadingSkeleton type="table" rows={10} />
      ) : error ? (
        <ErrorBanner
          title="Error Loading Transactions"
          message={error.message}
          onRetry={loadTransactions}
          isNetworkError={error.isNetworkError}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No Transactions Match Filters"
          message="Try broadening your search query, clearing risk filters, or recording a new test transaction."
          actionLabel={hasActiveFilters ? 'Reset Filters' : 'Record Transaction'}
          onAction={hasActiveFilters ? handleResetFilters : () => setCreateModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Beneficiary</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => navigate(`/investigation/${tx.id}`)}
                  >
                    <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                      {tx.transaction_reference}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-mono">
                      {tx.customer_reference}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono truncate max-w-[140px]">
                      {tx.beneficiary_reference}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                        {tx.transaction_channel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {formatDateTime(tx.transaction_timestamp)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800">
                      {tx.anomaly_score !== null && tx.anomaly_score !== undefined
                        ? tx.anomaly_score
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      {tx.risk_level ? (
                        <RiskBadge level={tx.risk_level} size="sm" />
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Unanalyzed</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/investigation/${tx.id}`)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-md transition-colors shadow-2xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{(page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{pagination.total}</span> records
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateFilter('page', String(page - 1))}
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
                onClick={() => updateFilter('page', String(page + 1))}
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

      {/* New Transaction Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Record New Transaction"
        subtitle="Ingest financial transaction record for compliance detection"
      >
        <form onSubmit={handleSubmit(onSubmitTransaction)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Reference *
              </label>
              <input
                type="text"
                {...register('customer_reference')}
                placeholder="e.g. CUST-0025"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/50"
              />
              {errors.customer_reference && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.customer_reference.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Source Account Reference *
              </label>
              <input
                type="text"
                {...register('source_account_reference')}
                placeholder="e.g. ACC-0025-01"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/50"
              />
              {errors.source_account_reference && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.source_account_reference.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Beneficiary Reference *
              </label>
              <input
                type="text"
                {...register('beneficiary_reference')}
                placeholder="e.g. BEN-9921"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/50"
              />
              {errors.beneficiary_reference && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.beneficiary_reference.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount')}
                placeholder="0.00"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/50"
              />
              {errors.amount && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Channel
              </label>
              <select
                {...register('transaction_channel')}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="ONLINE">Online Banking</option>
                <option value="MOBILE">Mobile App</option>
                <option value="ATM">ATM Terminal</option>
                <option value="POS">POS Terminal</option>
                <option value="BRANCH">Physical Branch</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Type
              </label>
              <select
                {...register('transaction_type')}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="TRANSFER">Transfer</option>
                <option value="PAYMENT">Payment</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="DEPOSIT">Deposit</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Submit Transaction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Transactions;
