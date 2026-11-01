/**
 * FTADS Explainable Weighted Scoring Engine
 * 
 * Aggregates detector signals into a normalized [0, 100] anomaly score,
 * classifies risk level, calculates individual factor contributions,
 * and handles missing signals via proportional weight re-normalization.
 */
export class ScoringEngine {
  constructor(options = {}) {
    this.weights = options.weights || {
      amount: 0.35,
      velocity: 0.25,
      unusual_time: 0.15,
      repeated_transaction: 0.15,
      new_beneficiary: 0.10,
    };

    this.alertThreshold = options.alertThreshold ?? 60.0;
  }

  /**
   * Classifies a numerical anomaly score into academic risk categories.
   * 
   * @param {number} score - Anomaly score 0 - 100
   * @returns {'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'}
   */
  classifyRisk(score) {
    if (score >= 80.0) return 'CRITICAL';
    if (score >= 60.0) return 'HIGH';
    if (score >= 30.0) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Computes the weighted composite anomaly score from detector signals.
   * 
   * Formula:
   *   Score = (Sum_{i in Available} w_i * score_i) / (Sum_{i in Available} w_i)
   * 
   * @param {Object} signals - Object keyed by signal name containing detector results
   * @returns {Object} Composite score, risk level, contributions, and synthesized explanation
   */
  calculateCompositeScore(signals) {
    let weightedSum = 0;
    let availableWeightSum = 0;
    const signalContributions = {};
    const missingSignals = [];
    const triggeredSignals = [];

    for (const [key, result] of Object.entries(signals)) {
      const weight = this.weights[key] ?? 0;

      if (!result.signalAvailable) {
        missingSignals.push({
          signal: key,
          nominalWeight: weight,
          reason: result.metrics?.reason || 'UNAVAILABLE',
        });
        signalContributions[key] = {
          rawScore: 0,
          weight,
          effectiveWeight: 0,
          contribution: 0,
          status: 'UNAVAILABLE',
          explanation: result.explanation,
        };
        continue;
      }

      weightedSum += result.rawScore * weight;
      availableWeightSum += weight;

      if (result.triggered) {
        triggeredSignals.push({
          signal: key,
          score: result.rawScore,
          explanation: result.explanation,
        });
      }
    }

    // Proportional re-normalization when some signals are unavailable
    let finalScore = 0;
    if (availableWeightSum > 0) {
      finalScore = weightedSum / availableWeightSum;
    }

    // Clamp score strictly between 0 and 100
    finalScore = Math.max(0, Math.min(100, Number(finalScore.toFixed(2))));
    const riskLevel = this.classifyRisk(finalScore);

    // Compute effective weights and contributions
    for (const [key, result] of Object.entries(signals)) {
      if (result.signalAvailable && availableWeightSum > 0) {
        const nominalWeight = this.weights[key] ?? 0;
        const effectiveWeight = nominalWeight / availableWeightSum;
        const contribution = Number((result.rawScore * effectiveWeight).toFixed(2));
        signalContributions[key] = {
          rawScore: result.rawScore,
          nominalWeight,
          effectiveWeight: Number(effectiveWeight.toFixed(4)),
          contribution,
          status: 'ACTIVE',
          triggered: result.triggered,
          explanation: result.explanation,
          metrics: result.metrics,
        };
      }
    }

    // Build synthesized human-readable explanation
    const explanation = this.buildSynthesizedExplanation(
      finalScore,
      riskLevel,
      triggeredSignals,
      missingSignals
    );

    return {
      anomalyScore: finalScore,
      riskLevel,
      isAlertTriggered: finalScore >= this.alertThreshold,
      alertThreshold: this.alertThreshold,
      activeWeightsSum: Number(availableWeightSum.toFixed(4)),
      missingSignalsCount: missingSignals.length,
      signalContributions,
      explanation,
    };
  }

  /**
   * Synthesizes an executive explanation summarizing the findings.
   */
  buildSynthesizedExplanation(score, riskLevel, triggered, missing) {
    if (triggered.length === 0) {
      let text = `Transaction exhibits normal behavior with an anomaly score of ${score.toFixed(1)}/100 (Risk: ${riskLevel}). All statistical signals fall within customary parameters.`;
      if (missing.length > 0) {
        text += ` Note: ${missing.length} signal(s) (${missing.map((m) => m.signal).join(', ')}) had insufficient historical baseline and weights were proportionally normalized.`;
      }
      return text;
    }

    const descriptions = triggered.map((t) => t.explanation);
    let summary = `Suspicious financial transaction flagged with anomaly score of ${score.toFixed(1)}/100 (Risk Level: ${riskLevel}). Key deviations detected: ${descriptions.join(' ')}`;

    if (missing.length > 0) {
      summary += ` Baseline weights were normalized across active indicators due to limited history on: ${missing.map((m) => m.signal).join(', ')}.`;
    }

    return summary;
  }
}

export default ScoringEngine;
