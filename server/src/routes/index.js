import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import detectionRoutes from './detectionRoutes.js';
import alertRoutes from './alertRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/transactions', transactionRoutes);
router.use('/detection', detectionRoutes);
router.use('/alerts', alertRoutes);
router.use('/reports', reportRoutes);

export default router;
