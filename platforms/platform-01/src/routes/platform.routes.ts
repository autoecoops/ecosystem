import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { evaluateSLOs } from '../observers/slo.observer';
import { processAlert, executeHealingAction, type HealingActionType } from '../healers/healing.engine';
import { writeAudit, publishEvent } from '../services/core-client.service';
import { logger } from '../services/logger.service';

const router = Router();

// ============================================================================
// GET /platform/slo - Get current SLO status
// ============================================================================
router.get('/slo', async (req: Request, res: Response): Promise<void> => {
  try {
    const sloStatuses = await evaluateSLOs();
    res.json({
      success: true,
      data: { slos: sloStatuses },
      meta: { requestId: uuidv4(), traceId: (req.headers['x-trace-id'] as string) ?? uuidv4(), timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error({ error }, 'SLO evaluation failed');
    res.status(500).json({ success: false, error: { code: 'SLO_EVAL_FAILED', message: 'SLO evaluation failed' } });
  }
});

// ============================================================================
// POST /platform/alerts/webhook - Alertmanager webhook receiver
// ============================================================================
router.post('/alerts/webhook', async (req: Request, res: Response): Promise<void> => {
  const { alerts } = req.body as { alerts?: Array<{
    labels: Record<string, string>;
    annotations: Record<string, string>;
    status: 'firing' | 'resolved';
    startsAt: string;
  }> };

  if (!alerts || !Array.isArray(alerts)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_PAYLOAD', message: 'alerts array is required' } });
    return;
  }

  const traceId = (req.headers['x-trace-id'] as string) ?? uuidv4();
  const results: Array<{ alertName: string; action: string | null; status: string }> = [];

  for (const alert of alerts) {
    const alertPayload = {
      alertName: alert.labels.alertname ?? 'unknown',
      labels: alert.labels,
      annotations: alert.annotations,
      status: alert.status,
      startsAt: alert.startsAt,
    };

    const healingAction = processAlert(alertPayload);

    if (healingAction) {
      // Execute healing action
      const executedAction = await executeHealingAction(healingAction);

      // Write audit entry
      await writeAudit({
        timestamp: new Date().toISOString(),
        traceId,
        actor: { id: 'platform-01-healer', type: 'service' },
        resource: { kind: executedAction.target.kind, id: executedAction.target.name, namespace: executedAction.target.namespace },
        action: `self-heal:${executedAction.type}`,
        result: executedAction.status === 'completed' ? 'success' : 'failure',
        complianceTags: ['self-healing', 'automated-remediation'],
        metadata: { alertName: alertPayload.alertName, severity: executedAction.severity, retryCount: executedAction.retryCount },
      }, traceId).catch((err) => logger.error({ err }, 'Failed to write audit'));

      // Publish event
      await publishEvent({
        type: `platform-01.healing.${executedAction.status}`,
        source: 'platform-01',
        traceId,
        actor: { id: 'platform-01-healer', type: 'service' },
        resource: { kind: executedAction.target.kind, id: executedAction.target.name, namespace: executedAction.target.namespace },
        idempotencyKey: executedAction.id,
        priority: executedAction.severity === 'critical' ? 'critical' : 'high',
        data: executedAction,
      }, 'platform-01:healing', traceId).catch((err) => logger.error({ err }, 'Failed to publish event'));

      results.push({ alertName: alertPayload.alertName, action: executedAction.type, status: executedAction.status });
    } else {
      results.push({ alertName: alertPayload.alertName, action: null, status: 'no-action' });
    }
  }

  res.json({
    success: true,
    data: { processed: results.length, results },
    meta: { requestId: uuidv4(), traceId, timestamp: new Date().toISOString() },
  });
});

// ============================================================================
// POST /platform/heal - Manually trigger healing action
// ============================================================================
router.post('/heal', async (req: Request, res: Response): Promise<void> => {
  const { type, target, reason } = req.body as {
    type?: string;
    target?: { kind: string; name: string; namespace: string };
    reason?: string;
  };

  if (!type || !target || !reason) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'type, target, and reason are required' } });
    return;
  }

  const action = {
    id: uuidv4(),
    type: type as HealingActionType,
    target,
    reason,
    severity: 'medium' as const,
    status: 'pending' as const,
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };

  const result = await executeHealingAction(action);

  res.json({
    success: true,
    data: result,
    meta: { requestId: uuidv4(), traceId: (req.headers['x-trace-id'] as string) ?? uuidv4(), timestamp: new Date().toISOString() },
  });
});

export default router;
