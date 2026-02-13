import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { evaluatePolicy, evaluateBuiltinPolicy } from '../engine/opa.engine';
import { writeAuditEntry, queryAuditEntries } from '../services/audit.store';
import { generateSOC2Report, generateISO27001Report } from '../reports/compliance.report';
import { logger } from '../services/logger.service';
import type { AuditEntry } from '@autoecops/shared-types';

const router = Router();

const evaluateSchema = z.object({
  policyPath: z.string().min(1),
  input: z.object({
    actor: z.object({ id: z.string(), type: z.string(), roles: z.array(z.string()) }),
    resource: z.object({ kind: z.string(), id: z.string(), namespace: z.string().optional() }),
    action: z.string(),
    context: z.record(z.unknown()).optional(),
  }),
});

const auditSchema = z.object({
  timestamp: z.string(),
  traceId: z.string(),
  actor: z.object({ id: z.string(), type: z.string(), email: z.string().optional() }),
  resource: z.object({ kind: z.string(), id: z.string(), namespace: z.string().optional() }),
  action: z.string(),
  result: z.enum(['success', 'failure', 'denied']),
  policyDecision: z.object({
    verdict: z.enum(['allow', 'deny', 'warn']),
    policyId: z.string(),
    policyVersion: z.string(),
    reason: z.string(),
    complianceTags: z.array(z.string()),
    evaluatedAt: z.string(),
  }).optional(),
  complianceTags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// POST /policy/evaluate - Evaluate a policy
// ============================================================================
router.post('/evaluate', async (req: Request, res: Response): Promise<void> => {
  const validation = evaluateSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.format() } });
    return;
  }

  const { policyPath, input } = validation.data;

  try {
    const decision = await evaluatePolicy(policyPath, input);
    res.json({
      success: true,
      data: { decision },
      meta: { requestId: uuidv4(), traceId: (req.headers['x-trace-id'] as string) ?? uuidv4(), timestamp: new Date().toISOString() },
    });
  } catch {
    // Fallback to built-in policy
    const decision = evaluateBuiltinPolicy(input);
    res.json({
      success: true,
      data: { decision, fallback: true },
      meta: { requestId: uuidv4(), traceId: (req.headers['x-trace-id'] as string) ?? uuidv4(), timestamp: new Date().toISOString() },
    });
  }
});

// ============================================================================
// POST /audit/write - Write an audit entry
// ============================================================================
router.post('/audit/write', async (req: Request, res: Response): Promise<void> => {
  const validation = auditSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid audit entry', details: validation.error.format() } });
    return;
  }

  try {
    const id = await writeAuditEntry(validation.data as Omit<AuditEntry, 'id'>);
    res.status(201).json({
      success: true,
      data: { id },
      meta: { requestId: uuidv4(), traceId: validation.data.traceId, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to write audit entry');
    res.status(500).json({ success: false, error: { code: 'AUDIT_WRITE_FAILED', message: 'Failed to write audit entry' } });
  }
});

// ============================================================================
// GET /audit/query - Query audit entries
// ============================================================================
router.get('/audit/query', async (req: Request, res: Response): Promise<void> => {
  const query = req.query as Record<string, string>;
  try {
    const result = await queryAuditEntries({
      startTime: query.startTime,
      endTime: query.endTime,
      actorId: query.actorId,
      resourceKind: query.resourceKind,
      resourceId: query.resourceId,
      action: query.action,
      result: query.result,
      complianceTag: query.complianceTag,
      traceId: query.traceId,
      page: query.page ? parseInt(query.page, 10) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize, 10) : 50,
    });

    res.json({
      success: true,
      data: result,
      meta: { requestId: uuidv4(), traceId: (req.headers['x-trace-id'] as string) ?? uuidv4(), timestamp: new Date().toISOString(), pagination: { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: Math.ceil(result.total / result.pageSize) } },
    });
  } catch (error) {
    logger.error({ error }, 'Audit query failed');
    res.status(500).json({ success: false, error: { code: 'QUERY_FAILED', message: 'Audit query failed' } });
  }
});

// ============================================================================
// POST /reports/compliance - Generate compliance report
// ============================================================================
router.post('/reports/compliance', async (req: Request, res: Response): Promise<void> => {
  const { framework, startTime, endTime } = req.body as { framework?: string; startTime?: string; endTime?: string };

  if (!framework || !startTime || !endTime) {
    res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'framework, startTime, and endTime are required' } });
    return;
  }

  try {
    let report;
    switch (framework.toUpperCase()) {
      case 'SOC2':
        report = await generateSOC2Report(startTime, endTime);
        break;
      case 'ISO27001':
        report = await generateISO27001Report(startTime, endTime);
        break;
      default:
        res.status(400).json({ success: false, error: { code: 'UNSUPPORTED_FRAMEWORK', message: `Unsupported framework: ${framework}` } });
        return;
    }

    res.json({
      success: true,
      data: report,
      meta: { requestId: uuidv4(), traceId: (req.headers['x-trace-id'] as string) ?? uuidv4(), timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error({ error, framework }, 'Report generation failed');
    res.status(500).json({ success: false, error: { code: 'REPORT_FAILED', message: 'Report generation failed' } });
  }
});

export default router;
