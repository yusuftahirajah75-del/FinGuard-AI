import { z } from 'zod';

export const batchAnalyzeSchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  onlyUnanalyzed: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(true)),
});

export const updateSettingsSchema = z.object({
  weights: z.object({
    amount: z.number().min(0).max(1),
    velocity: z.number().min(0).max(1),
    unusual_time: z.number().min(0).max(1),
    repeated_transaction: z.number().min(0).max(1),
    new_beneficiary: z.number().min(0).max(1),
  }).refine(
    (weights) => {
      const sum = weights.amount + weights.velocity + weights.unusual_time + weights.repeated_transaction + weights.new_beneficiary;
      return Math.abs(sum - 1.0) < 0.001;
    },
    { message: 'Detection weights must sum precisely to 1.0 (100%)' }
  ).optional(),
  thresholds: z.object({
    alert_trigger_score: z.number().min(0).max(100).optional(),
    amount: z.object({
      min_history_count: z.number().int().min(1).optional(),
      modified_z_threshold: z.number().positive().optional(),
    }).optional(),
    velocity: z.object({
      window_5m_count_threshold: z.number().int().min(1).optional(),
      window_1h_count_threshold: z.number().int().min(1).optional(),
    }).optional(),
    unusual_time: z.object({
      min_history_count: z.number().int().min(1).optional(),
      hour_probability_threshold: z.number().min(0).max(1).optional(),
    }).optional(),
    repeated_transaction: z.object({
      window_minutes: z.number().int().min(1).optional(),
      amount_tolerance_percent: z.number().min(0).max(0.5).optional(),
    }).optional(),
    new_beneficiary: z.object({
      min_history_count: z.number().int().min(1).optional(),
      novelty_signal_score: z.number().min(0).max(100).optional(),
    }).optional(),
  }).optional(),
  description: z.string().max(255).optional(),
});
