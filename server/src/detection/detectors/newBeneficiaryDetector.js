/**
 * New Beneficiary Detector
 * 
 * Identifies transfers to beneficiaries previously unseen in the customer's history.
 * 
 * Academic Principle:
 * In modern banking risk models, a novel beneficiary is an exploratory signal (typically weighted ~10%).
 * A new counterparty by itself is standard legitimate human activity (paying a new friend or bill).
 * Therefore, this detector explicitly states that an unfamiliar beneficiary is NOT inherently fraudulent,
 * but provides situational context when combined with velocity or amount anomalies.
 */
export class NewBeneficiaryDetector {
  constructor(config = {}) {
    this.minHistoryCount = config.minHistoryCount ?? 3;
    this.noveltySignalScore = config.noveltySignalScore ?? 45.0;
  }

  /**
   * Evaluates if beneficiary has been transacted with previously by this customer.
   * 
   * @param {Object} transaction - Current transaction
   * @param {Array<Object>} history - Customer transactions (strictly prior)
   * @returns {Object} Detector signal evaluation result
   */
  evaluate(transaction, history = []) {
    const currentTimestamp = new Date(transaction.transaction_timestamp).getTime();
    const candidateBeneficiary = transaction.beneficiary_reference;

    // Filter valid prior history
    const validHistory = history.filter((t) => {
      if (t.id && transaction.id && t.id === transaction.id) return false;
      return new Date(t.transaction_timestamp).getTime() < currentTimestamp;
    });

    if (validHistory.length < this.minHistoryCount) {
      return {
        signalName: 'new_beneficiary',
        signalAvailable: false,
        rawScore: 0,
        triggered: false,
        metrics: {
          beneficiary: candidateBeneficiary,
          historicalCount: validHistory.length,
          minRequiredHistory: this.minHistoryCount,
          reason: 'INSUFFICIENT_HISTORY',
        },
        explanation: `Insufficient customer history (${validHistory.length} of ${this.minHistoryCount} required) to determine beneficiary novelty baseline.`,
      };
    }

    // Extract unique known beneficiaries prior to this transaction
    const priorBeneficiaries = new Set(validHistory.map((t) => t.beneficiary_reference));
    const isNew = !priorBeneficiaries.has(candidateBeneficiary);

    const rawScore = isNew ? this.noveltySignalScore : 0.0;
    const triggered = isNew;

    let explanation;
    if (isNew) {
      explanation = `Beneficiary '${candidateBeneficiary}' is newly introduced (not present among ${priorBeneficiaries.size} known recipient(s) across ${validHistory.length} prior transactions). A new counterparty alone is not inherently fraudulent, but elevates composite risk if paired with amount or velocity deviations.`;
    } else {
      const priorCountWithBeneficiary = validHistory.filter((t) => t.beneficiary_reference === candidateBeneficiary).length;
      explanation = `Beneficiary '${candidateBeneficiary}' is established in customer profile (${priorCountWithBeneficiary} prior transfer(s)).`;
    }

    return {
      signalName: 'new_beneficiary',
      signalAvailable: true,
      rawScore,
      triggered,
      metrics: {
        beneficiary: candidateBeneficiary,
        isNewBeneficiary: isNew,
        knownBeneficiariesCount: priorBeneficiaries.size,
        customerPriorTxnCount: validHistory.length,
      },
      explanation,
    };
  }
}

export default NewBeneficiaryDetector;
