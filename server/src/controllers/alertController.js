import alertService from '../services/alertService.js';

export async function getAlerts(req, res, next) {
  try {
    const alerts = await alertService.getAlerts(req.query);
    res.json({
      success: true,
      message: 'Alerts retrieved successfully',
      data: alerts.items,
      pagination: alerts.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAlertById(req, res, next) {
  try {
    const { id } = req.params;
    const alert = await alertService.getAlertById(id);
    res.json({
      success: true,
      message: 'Alert investigation details retrieved',
      data: alert,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAlert(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await alertService.updateAlert(id, req.body);
    res.json({
      success: true,
      message: `Alert '${id}' updated successfully`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getAlerts,
  getAlertById,
  updateAlert,
};

