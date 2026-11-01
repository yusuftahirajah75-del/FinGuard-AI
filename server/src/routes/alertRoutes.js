import { Router } from 'express';
import alertController from '../controllers/alertController.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  updateAlertSchema,
  listAlertsQuerySchema,
} from '../validators/alertValidators.js';

const router = Router();

router.get(
  '/',
  validateRequest({ query: listAlertsQuerySchema }),
  alertController.getAlerts
);

router.get('/:id', alertController.getAlertById);

router.patch(
  '/:id',
  validateRequest({ body: updateAlertSchema }),
  alertController.updateAlert
);

export default router;
