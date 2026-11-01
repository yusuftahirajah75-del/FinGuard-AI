import { z } from 'zod';

export const updateAlertSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'FALSE_POSITIVE']).optional(),
  assigned_analyst: z.string().max(64).nullable().optional(),
  investigation_notes: z.string().max(4000).optional(),
  actor_reference: z.string().max(64).default('analyst'),
}).refine(
  (data) => data.status !== undefined || data.assigned_analyst !== undefined || data.investigation_notes !== undefined,
  { message: 'At least one field (status, assigned_analyst, investigation_notes) must be provided for update' }
);

export const listAlertsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'FALSE_POSITIVE']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedAnalyst: z.string().max(64).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'severity', 'status', 'score', 'amount']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('DESC'),
});

