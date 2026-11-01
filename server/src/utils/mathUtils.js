/**
 * Statistical Math Utilities for FTADS Anomaly Detection Engine
 */

/**
 * Calculates the median of a numerical array.
 * @param {Array<number>} values
 * @returns {number}
 */
export function calculateMedian(values) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculates the Median Absolute Deviation (MAD).
 * MAD = median(|x_i - median(X)|)
 * @param {Array<number>} values
 * @param {number} [median] - Optional precalculated median
 * @returns {number}
 */
export function calculateMAD(values, median = null) {
  if (!values || values.length === 0) return 0;
  const med = median !== null ? median : calculateMedian(values);
  const absoluteDeviations = values.map((val) => Math.abs(val - med));
  return calculateMedian(absoluteDeviations);
}

/**
 * Calculates the Mean Absolute Deviation (MeanAD) used as fallback when MAD = 0.
 * @param {Array<number>} values
 * @returns {number}
 */
export function calculateMeanAD(values) {
  if (!values || values.length === 0) return 0;
  const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
  const sumAbsDev = values.reduce((acc, v) => acc + Math.abs(v - mean), 0);
  return sumAbsDev / values.length;
}

/**
 * Calculates Boris Iglewicz and David Hoaglin Modified Z-Score.
 * M_i = 0.6745 * (x - median) / MAD
 * Handles Zero MAD with Mean Absolute Deviation or relative ratio fallback.
 * 
 * @param {number} value - The candidate value
 * @param {Array<number>} history - Historical values
 * @returns {Object} { modifiedZScore, median, mad, fallbackUsed }
 */
export function calculateModifiedZScore(value, history) {
  if (!history || history.length === 0) {
    return {
      modifiedZScore: 0,
      median: 0,
      mad: 0,
      fallbackUsed: 'NO_HISTORY',
    };
  }

  const median = calculateMedian(history);
  const mad = calculateMAD(history, median);

  // If MAD > 0, compute standard Iglewicz-Hoaglin modified z-score
  if (mad > 0) {
    const modifiedZScore = (0.6745 * (value - median)) / mad;
    return {
      modifiedZScore: Number(modifiedZScore.toFixed(4)),
      median: Number(median.toFixed(2)),
      mad: Number(mad.toFixed(2)),
      fallbackUsed: null,
    };
  }

  // Handle ZERO MAD: Prior values have zero dispersion around median
  const meanAD = calculateMeanAD(history);
  if (meanAD > 0) {
    // Fallback 1: Use Mean Absolute Deviation with standard scaling
    const fallbackZ = (0.7979 * (value - median)) / meanAD;
    return {
      modifiedZScore: Number(fallbackZ.toFixed(4)),
      median: Number(median.toFixed(2)),
      mad: 0,
      fallbackUsed: 'MEAN_ABSOLUTE_DEVIATION',
    };
  }

  // Fallback 2: History contains identical values (e.g., all 100.00)
  if (value === median) {
    return {
      modifiedZScore: 0,
      median: Number(median.toFixed(2)),
      mad: 0,
      fallbackUsed: 'IDENTICAL_MATCH',
    };
  }

  // Relative ratio deviation fallback
  const base = median > 0 ? median : 1;
  const ratioDev = (value - median) / base;
  // Scale relative multiplier into a pseudo-z score (e.g. 2x deviation ~ 3.0 z-score)
  const syntheticZ = ratioDev * 3.0;

  return {
    modifiedZScore: Number(syntheticZ.toFixed(4)),
    median: Number(median.toFixed(2)),
    mad: 0,
    fallbackUsed: 'RELATIVE_RATIO_MULTIPLIER',
  };
}

/**
 * Maps a modified Z-score to an explainable [0, 100] anomaly sub-score.
 * 
 * Thresholds:
 * - Z <= 1.5: Normal variation (0 - 15)
 * - 1.5 < Z <= 3.0: Moderate variation (15 - 50)
 * - 3.0 < Z <= 6.0: High anomaly (50 - 85)
 * - Z > 6.0: Extreme anomaly (85 - 100)
 * 
 * @param {number} zScore - Signed or unsigned z-score (we evaluate positive magnitude for amounts)
 * @returns {number} Score from 0.0 to 100.0
 */
export function zScoreToAnomalyScore(zScore) {
  // Financial theft/fraud spikes are predominantly elevated amounts, but negative dips can be noted
  const z = Math.max(0, zScore);

  if (z <= 1.0) {
    // Linear 0 to 10
    return Math.min(10, z * 10);
  }
  if (z <= 2.5) {
    // 1.0 -> 10, 2.5 -> 35
    return 10 + ((z - 1.0) / 1.5) * 25;
  }
  if (z <= 4.0) {
    // 2.5 -> 35, 4.0 -> 70
    return 35 + ((z - 2.5) / 1.5) * 35;
  }
  if (z <= 8.0) {
    // 4.0 -> 70, 8.0 -> 95
    return 70 + ((z - 4.0) / 4.0) * 25;
  }
  // Above 8.0 MAD deviations asymptotic to 100
  return Math.min(100, 95 + ((z - 8.0) / (z + 2.0)) * 5);
}

export default {
  calculateMedian,
  calculateMAD,
  calculateMeanAD,
  calculateModifiedZScore,
  zScoreToAnomalyScore,
};
