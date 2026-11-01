import reportService from '../services/reportService.js';

export async function getSummary(req, res, next) {
  try {
    const summary = await reportService.getSummary();
    res.json({
      success: true,
      message: 'System summary reports retrieved',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

export async function getConfusionMatrix(req, res, next) {
  try {
    const evaluation = await reportService.getConfusionMatrix(req.query);
    res.json({
      success: true,
      message: 'Academic Anomaly Detection Evaluation & Confusion Matrix',
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
}

export async function exportReport(req, res, next) {
  try {
    const type = req.query.type || 'transactions';
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
    const csvData = await reportService.exportCsv(type, limit);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ftads-${type}-export-${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
}

export default {
  getSummary,
  getConfusionMatrix,
  exportReport,
};
