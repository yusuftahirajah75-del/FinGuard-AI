import { calculateModifiedZScore, zScoreToAnomalyScore } from '../../utils/mathUtils.js';

/**
 * Amount Anomaly Detector
 * 
 * Uses robust non-parametric statistics (Median & Median Absolute Deviation / MAD)
 * to compute modified Z-scores. Standard Z-scores rely on mean and standard deviation,
 * which are heavily distorted by extreme financial fraud outliers.
 * 
 * Robust Iglewicz-Hoaglin Modified Z-Score:
 *   M_i = 0.6745 * (amount - median) / MAD
 * 
 * Fallbacks:
 * - If customer history < minHistoryCount (default: 3 transactions), signal is marked UNAVAILABLE.
 * - If MAD == 0 (zero dispersion), uses Mean Absolute Deviation fallback, or relative ratio deviation.
 */
export class AmountDetector {
  constructor(config = {}) {
    this.minHistoryCount = config.minHistoryCount ?? 3;
    this.modifiedZThreshold = config.modifiedZThreshold ?? 3.0;
  }

  /**
   * Evaluates the transaction amount against customer's past transactions.
   * 
   * @param {Object} transaction - Current transaction { id, amount, customer_reference, transaction_timestamp }
   * @param {Array<Object>} history - Prior transactions for the customer (strictly timestamp < current)
   * @returns {Object} Detector signal evaluation result
   */
  evaluate(transaction, history = []) {
    const amount = Number(transaction.amount);

    // Filter historical transactions strictly prior to the current transaction to prevent data leakage
    const currentTimestamp = new Date(transaction.transaction_timestamp).getTime();
    const validHistory = history.filter((t) => {
      // Exclude the transaction itself if present
      if (t.id && transaction.id && t.id === transaction.id) return false;
      const tTime = new Date(t.transaction_timestamp).getTime();
      return tTime < currentTimestamp;
    });

    // Check history sufficiency
    if (validHistory.length < this.minHistoryCount) {
      return {
        signalName: 'amount',
        signalAvailable: false,
        rawScore: 0,
        triggered: false,
        metrics: {
          currentAmount: amount,
          historicalCount: validHistory.length,
          minRequiredHistory: this.minHistoryCount,
          reason: 'INSUFFICIENT_HISTORY',
        },
        explanation: `Insufficient customer transaction history (${validHistory.length} of ${this.minHistoryCount} required) to establish a baseline amount distribution.`,
      };
    }

    const pastAmounts = validHistory.map((t) => Number(t.amount));
    const { modifiedZScore, median, mad, fallbackUsed } = calculateModifiedZScore(amount, pastAmounts);
    const rawScore = Number(zScoreToAnomalyScore(modifiedZScore).toFixed(2));
    const triggered = modifiedZScore >= this.modifiedZThreshold;

    let explanation;
    if (triggered) {
      if (fallbackUsed) {
        explanation = `Transaction amount $${amount.toFixed(2)} deviates substantially from historical median of $${median.toFixed(2)} (${fallbackUsed.replace(/_/g, ' ').toLowerCase()} fallback triggered).`;
      } else {
        explanation = `Transaction amount $${amount.toFixed(2)} is an anomaly, deviating ${modifiedZScore.toFixed(2)} MAD standard deviations above customer historical median ($${median.toFixed(2)}, MAD: $${mad.toFixed(2)} across ${validHistory.length} past transactions).`;
      }
    } else {
      explanation = `Transaction amount $${amount.toFixed(2)} is consistent with customer historical median ($${median.toFixed(2)}, modified Z: ${modifiedZScore.toFixed(2)}).`;
    }

    return {
      signalName: 'amount',
      signalAvailable: true,
      rawScore,
      triggered,
      metrics: {
        currentAmount: amount,
        historicalMedian: median,
        historicalMAD: mad,
        modifiedZScore,
        historicalCount: validHistory.length,
        fallbackUsed,
      },
      explanation,
    };
  }
}

export default AmountDetector;
