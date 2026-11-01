import alertRepository from '../repositories/alertRepository.js';
import auditLogRepository from '../repositories/auditLogRepository.js';

export class AlertService {
  async getAlerts(options) {
    return alertRepository.findPaginated(options);
  }

  async getAlertById(id) {
    const alert = await alertRepository.findById(id);
    if (!alert) {
      const error = new Error(`Alert with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }

    // Retrieve audit history
    const auditLogs = await auditLogRepository.findByAlertId(id);

    return {
      ...alert,
      auditLogs,
    };
  }

  async updateAlert(id, updateData) {
    const existing = await alertRepository.findById(id);
    if (!existing) {
      const error = new Error(`Alert with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const previousValue = {
      status: existing.status,
      assigned_analyst: existing.assigned_analyst,
      investigation_notes: existing.investigation_notes,
    };

    const updated = await alertRepository.update(id, updateData);

    const newValue = {
      status: updated.status,
      assigned_analyst: updated.assigned_analyst,
      investigation_notes: updated.investigation_notes,
    };

    // Determine audit action
    let action = 'ALERT_UPDATED';
    if (updateData.status && updateData.status !== existing.status) {
      action = `STATUS_CHANGED_TO_${updateData.status}`;
    } else if (updateData.assigned_analyst && updateData.assigned_analyst !== existing.assigned_analyst) {
      action = 'ANALYST_REASSIGNED';
    } else if (updateData.investigation_notes && updateData.investigation_notes !== existing.investigation_notes) {
      action = 'INVESTIGATION_NOTES_UPDATED';
    }

    const actor = updateData.actor_reference || 'analyst';

    // Record in audit log
    await auditLogRepository.create({
      alert_id: id,
      action,
      previous_value: previousValue,
      new_value: newValue,
      actor_reference: actor,
    });

    return updated;
  }
}

export default new AlertService();

