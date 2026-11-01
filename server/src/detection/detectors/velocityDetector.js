/**
 * Transaction Velocity Detector
 * 
 * Measures transaction frequency within critical rolling windows:
 * - 5-minute window (detects rapid automated bursts, script attacks, card stuffing)
 * - 1-hour window (detects sustained abnormal drainage / account takeovers)
 */
export class VelocityDetector {
  constructor(config = {}) {
    this.window5mThreshold = config.window5mThreshold ?? 3;
    this.window1hThreshold = config.window1hThreshold ?? 8;
  }

  /**
   * Evaluates velocity bursts for a customer.
   * 
   * @param {Object} transaction - Current transaction
   * @param {Array<Object>} history - Customer transactions (strictly prior to current transaction)
   * @returns {Object} Detector signal evaluation result
   */
  evaluate(transaction, history = []) {
    const currentTimestamp = new Date(transaction.transaction_timestamp).getTime();
    const fiveMinutesAgo = currentTimestamp - (5 * 60 * 1000);
    const oneHourAgo = currentTimestamp - (60 * 60 * 1000);

    // Filter strictly prior transactions within time windows (avoid future data leakage and exclude self)
    let count5m = 0;
    let count1h = 0;

    for (const t of history) {
      if (t.id && transaction.id && t.id === transaction.id) continue;
      const tTime = new Date(t.transaction_timestamp).getTime();
      if (tTime >= currentTimestamp) continue; // strictly past only

      if (tTime >= oneHourAgo) {
        count1h++;
        if (tTime >= fiveMinutesAgo) {
          count5m++;
        }
      }
    }

    // Velocity score calculation
    // Exceeding 5m threshold is higher urgency than 1h threshold
    let score5m = 0;
    if (count5m >= this.window5mThreshold) {
      // 3 txns -> 60 score, 4 txns -> 75, 5+ -> 90-100
      score5m = Math.min(100, 60 + ((count5m - this.window5mThreshold) * 15));
    } else if (count5m > 0) {
      score5m = (count5m / this.window5mThreshold) * 35;
    }

    let score1h = 0;
    if (count1h >= this.window1hThreshold) {
      // 8 txns -> 55 score, each additional +10 up to 100
      score1h = Math.min(100, 55 + ((count1h - this.window1hThreshold) * 10));
    } else if (count1h > 0) {
      score1h = (count1h / this.window1hThreshold) * 30;
    }

    const rawScore = Number(Math.max(score5m, score1h).toFixed(2));
    const burst5m = count5m >= this.window5mThreshold;
    const burst1h = count1h >= this.window1hThreshold;
    const triggered = burst5m || burst1h;

    let explanation;
    if (burst5m && burst1h) {
      explanation = `Severe transaction burst: ${count5m} transactions in past 5 minutes (limit: ${this.window5mThreshold}) and ${count1h} transactions in past hour (limit: ${this.window1hThreshold}).`;
    } else if (burst5m) {
      explanation = `Rapid transaction velocity burst detected: ${count5m} transactions initiated within 5 minutes (exceeds safety threshold of ${this.window5mThreshold}).`;
    } else if (burst1h) {
      explanation = `Elevated hourly transaction velocity: ${count1h} transactions recorded within 1 hour (exceeds safety threshold of ${this.window1hThreshold}).`;
    } else {
      explanation = `Transaction velocity is normal (${count5m} in past 5m, ${count1h} in past 1h).`;
    }

    return {
      signalName: 'velocity',
      signalAvailable: true,
      rawScore,
      triggered,
      metrics: {
        count5m,
        count1h,
        window5mThreshold: this.window5mThreshold,
        window1hThreshold: this.window1hThreshold,
        burst5m,
        burst1h,
      },
      explanation,
    };
  }
}

export default VelocityDetector;
