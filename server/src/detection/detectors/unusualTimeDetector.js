/**
 * Unusual Transaction Time Detector
 * 
 * Analyzes the temporal profile of a customer's spending.
 * Human diurnal habits are remarkably consistent; transactions occurring during
 * habitual sleep cycles or off-peak hours represent a common fraud indicator.
 */
export class UnusualTimeDetector {
  constructor(config = {}) {
    this.minHistoryCount = config.minHistoryCount ?? 5;
    this.hourProbabilityThreshold = config.hourProbabilityThreshold ?? 0.05;
  }

  /**
   * Evaluates if the transaction hour is anomalous for this specific customer.
   * 
   * @param {Object} transaction - Current transaction
   * @param {Array<Object>} history - Customer transactions (strictly prior to current transaction)
   * @returns {Object} Detector signal evaluation result
   */
  evaluate(transaction, history = []) {
    const currentTimestamp = new Date(transaction.transaction_timestamp);
    const currentHour = currentTimestamp.getUTCHours();
    const currentTimeMs = currentTimestamp.getTime();

    // Filter valid prior history
    const validHistory = history.filter((t) => {
      if (t.id && transaction.id && t.id === transaction.id) return false;
      return new Date(t.transaction_timestamp).getTime() < currentTimeMs;
    });

    if (validHistory.length < this.minHistoryCount) {
      return {
        signalName: 'unusual_time',
        signalAvailable: false,
        rawScore: 0,
        triggered: false,
        metrics: {
          transactionHourUTC: currentHour,
          historicalCount: validHistory.length,
          minRequiredHistory: this.minHistoryCount,
          reason: 'INSUFFICIENT_HISTORY',
        },
        explanation: `Insufficient customer transaction history (${validHistory.length} of ${this.minHistoryCount} required) to model habitual activity hours.`,
      };
    }

    // Build historical hourly distribution
    const hourlyCounts = new Array(24).fill(0);
    for (const t of validHistory) {
      const h = new Date(t.transaction_timestamp).getUTCHours();
      hourlyCounts[h]++;
    }

    const totalHistorical = validHistory.length;
    // Calculate probability of current hour plus adjacent 1-hour window (smoothed)
    const prevHour = (currentHour + 23) % 24;
    const nextHour = (currentHour + 1) % 24;
    const windowMatches = hourlyCounts[prevHour] + hourlyCounts[currentHour] + hourlyCounts[nextHour];
    const windowProbability = windowMatches / (totalHistorical * 3);
    const exactHourProbability = hourlyCounts[currentHour] / totalHistorical;

    // Identify customer's primary active hours range (e.g. 08:00 - 21:00)
    const activeHours = [];
    for (let h = 0; h < 24; h++) {
      if (hourlyCounts[h] > 0) activeHours.push(h);
    }
    const minActive = Math.min(...activeHours);
    const maxActive = Math.max(...activeHours);

    const triggered = exactHourProbability < this.hourProbabilityThreshold && windowProbability < 0.05;

    let rawScore = 0;
    if (triggered) {
      if (hourlyCounts[currentHour] === 0) {
        // Zero occurrences ever in this hour
        rawScore = windowMatches === 0 ? 75.0 : 55.0;
      } else {
        rawScore = 40.0;
      }
    } else {
      rawScore = 5.0;
    }

    const formattedHour = `${String(currentHour).padStart(2, '0')}:00 UTC`;
    let explanation;
    if (triggered) {
      explanation = `Transaction initiated at ${formattedHour}. Customer has ${hourlyCounts[currentHour]} historical records in this hour (${(exactHourProbability * 100).toFixed(1)}% of past ${totalHistorical} transactions). Usual window: ${String(minActive).padStart(2, '0')}:00-${String(maxActive).padStart(2, '0')}:00 UTC.`;
    } else {
      explanation = `Transaction time (${formattedHour}) matches customer normal activity patterns (${(exactHourProbability * 100).toFixed(1)}% historical frequency).`;
    }

    return {
      signalName: 'unusual_time',
      signalAvailable: true,
      rawScore,
      triggered,
      metrics: {
        transactionHourUTC: currentHour,
        exactHourCount: hourlyCounts[currentHour],
        exactHourProbability: Number(exactHourProbability.toFixed(4)),
        windowProbability: Number(windowProbability.toFixed(4)),
        historicalActiveWindow: `${minActive}:00-${maxActive}:00 UTC`,
        historicalCount: totalHistorical,
      },
      explanation,
    };
  }
}

export default UnusualTimeDetector;
