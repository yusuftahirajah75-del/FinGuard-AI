import detectionService from '../services/detectionService.js';

export async function analyzeTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const analysis = await detectionService.analyzeTransaction(id);
    res.json({
      success: true,
      message: 'Transaction analyzed successfully',
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
}

export async function analyzeBatch(req, res, next) {
  try {
    const summary = await detectionService.analyzeBatch(req.body);
    res.json({
      success: true,
      message: `Batch analysis completed: ${summary.totalProcessed} transactions evaluated`,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

export async function getResults(req, res, next) {
  try {
    const { transactionId } = req.params;
    const result = await detectionService.getResultsByTransactionId(transactionId);
    res.json({
      success: true,
      message: 'Detection results retrieved',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMethodology(req, res, next) {
  try {
    const methodology = detectionService.getMethodology();
    res.json({
      success: true,
      message: 'FTADS Anomaly Detection Methodology Specification',
      data: methodology,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSettings(req, res, next) {
  try {
    const settings = await detectionService.getSettings();
    res.json({
      success: true,
      message: 'Detection engine configuration retrieved',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const updated = await detectionService.updateSettings(req.body);
    res.json({
      success: true,
      message: 'Detection engine configuration updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  analyzeTransaction,
  analyzeBatch,
  getResults,
  getMethodology,
  getSettings,
  updateSettings,
};

