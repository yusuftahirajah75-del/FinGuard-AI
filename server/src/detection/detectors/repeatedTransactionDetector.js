/**
 * Repeated Transaction Detector
 * 
 * Detects identical or near-identical transfers:
 * - Same customer
 * - Same beneficiary
 * - Exact or near-identical amount (within tolerance percentage, e.g. 1%)
 * - Occurring within a short temporal window (e.g., 30 minutes)
 * 
 * In banking, repeated transfers within minutes frequently represent duplicate billing glitches,
 * automated retry scripts, or rapid fraud sweeps to deplete an account before detection.
 */
export class RepeatedTransactionDetector {
  constructor(config = {}) {
    this.windowMinutes = config.windowMinutes ?? 30;
    this.amountTolerancePercent = config.amountTolerancePercent ?? 0.01; // 1% tolerance
  }

  /**
   * Evaluates if a transaction matches a near-identical transfer within the observation window.
   * 
   * @param {Object} transaction - Current transaction
   * @param {Array<Object>} history - Customer transactions (strictly prior)
   * @returns {Object} Detector signal evaluation result
   */
  evaluate(transaction, history = []) {
    const currentTimestamp = new Date(transaction.transaction_timestamp).getTime();
    const windowStart = currentTimestamp - (this.windowMinutes * 60 * 1000);
    const currentAmount = Number(transaction.amount);

    const matchingTransactions = [];

    for (const t of history) {
      if (t.id && transaction.id && t.id === transaction.id) continue;
      const tTime = new Date(t.transaction_timestamp).getTime();

      // Must be strictly prior and within window
      if (tTime >= currentTimestamp || tTime < windowStart) continue;

      // Check same beneficiary
      if (t.beneficiary_reference !== transaction.beneficiary_reference) continue;

      // Check amount closeness
      const pastAmount = Number(t.amount);
      const diffRatio = Math.abs(currentAmount - pastAmount) / currentAmount;

      if (diffRatio <= this.amountTolerancePercent) {
        const diffMinutes = Math.round((currentTimestamp - tTime) / (60 * 1000));
        matchingTransactions.push({
          id: t.id,
          reference: t.transaction_reference,
          amount: pastAmount,
          timestamp: t.transaction_timestamp,
          diffMinutes,
        });
      }
    }

    const matchCount = matchingTransactions.length;
    const triggered = matchCount > 0;

    let rawScore = 0;
    let explanation;

    if (matchCount >= 2) {
      rawScore = 95.0;
      explanation = `High repetition: ${matchCount} near-identical transfers of ~$${currentAmount.toFixed(2)} to beneficiary '${transaction.beneficiary_reference}' detected within the last ${this.windowMinutes} minutes.`;
    } else if (matchCount === 1) {
      const match = matchingTransactions[0];
      rawScore = 75.0;
      explanation = `Potential duplicate transaction: an identical transfer of $${match.amount.toFixed(2)} to beneficiary '${transaction.beneficiary_reference}' occurred ${match.diffMinutes} minutes prior.`;
    } else {
      rawScore = 0;
      explanation = `No repeated or duplicate transfers detected to beneficiary '${transaction.beneficiary_reference}' within ${this.windowMinutes} minutes.`;
    }

    return {
      signalName: 'repeated_transaction',
      signalAvailable: true,
      rawScore,
      triggered,
      metrics: {
        matchingCount: matchCount,
        windowMinutes: this.windowMinutes,
        amountTolerancePercent: this.amountTolerancePercent,
        matches: matchingTransactions,
      },
      explanation,
    };
  }
}

export default RepeatedTransactionDetector;
