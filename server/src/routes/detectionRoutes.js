import { Router } from 'express';
import detectionController from '../controllers/detectionController.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  batchAnalyzeSchema,
  updateSettingsSchema,
} from '../validators/detectionValidators.js';

const router = Router();

router.post('/analyze/:id', detectionController.analyzeTransaction);

router.post(
  '/analyze-batch',
  validateRequest({ body: batchAnalyzeSchema }),
  detectionController.analyzeBatch
);

router.get('/results/:transactionId', detectionController.getResults);

router.get('/methodology', detectionController.getMethodology);

router.get('/settings', detectionController.getSettings);

router.put(
  '/settings',
  validateRequest({ body: updateSettingsSchema }),
  detectionController.updateSettings
);

router.patch(
  '/settings',
  validateRequest({ body: updateSettingsSchema }),
  detectionController.updateSettings
);

export default router;
