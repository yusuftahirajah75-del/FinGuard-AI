import reportService from '../services/reportService.js';
import anomalyRepository from '../repositories/anomalyRepository.js';
import alertRepository from '../repositories/alertRepository.js';

export async function getDashboardSummary(req, res, next) {
  try {
    const summary = await reportService.getSummary();
    const recentAnomalies = await anomalyRepository.findRecent(6);
    const recentAlerts = await alertRepository.findPaginated({
      page: 1,
      limit: 6,
      status: 'OPEN',
      sortBy: 'created_at',
      sortOrder: 'DESC',
    });

    res.json({
      success: true,
      message: 'Dashboard metrics retrieved successfully',
      data: {
        ...summary,
        recentAnomalies,
        activeOpenAlerts: recentAlerts.items,
      },
    });
  } catch (error) {
    next(error);
  }
}

export default { getDashboardSummary };
