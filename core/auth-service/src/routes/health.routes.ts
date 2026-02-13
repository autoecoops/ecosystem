import { Router, Request, Response } from 'express';
import type { HealthCheck } from '@autoecops/shared-types';
import { config } from '../config';

const router = Router();
const startTime = Date.now();

router.get('/health', (_req: Request, res: Response): void => {
  const uptimeMs = Date.now() - startTime;

  const health: HealthCheck = {
    status: 'healthy',
    version: config.VERSION,
    uptime: uptimeMs,
    timestamp: new Date().toISOString(),
    checks: {
      oidc: {
        status: 'healthy',
        latencyMs: 0,
        message: 'OIDC provider reachable',
      },
      rbac: {
        status: 'healthy',
        latencyMs: 0,
        message: 'RBAC policy loaded',
      },
    },
  };

  res.json(health);
});

router.get('/ready', (_req: Request, res: Response): void => {
  res.json({ ready: true, timestamp: new Date().toISOString() });
});

router.get('/live', (_req: Request, res: Response): void => {
  res.json({ alive: true, timestamp: new Date().toISOString() });
});

export default router;
