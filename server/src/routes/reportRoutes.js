import { Router } from 'express';
import reportController from '../controllers/reportController.js';

const router = Router();

router.get('/summary', reportController.getSummary);
router.get('/confusion-matrix', reportController.getConfusionMatrix);
router.get('/export', reportController.exportReport);

export default router;

