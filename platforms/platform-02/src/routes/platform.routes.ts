import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { validateKubernetesManifest, verifySupplyChain } from '../services/iac.validator';
import { triggerDeployment } from '../services/gitops.service';
import { logger } from '../services/logger.service';

const router = Router();

// POST /platform/validate - Validate Kubernetes manifests
router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  const { manifests } = req.body as { manifests?: Record<string, unknown>[] };
  if (!manifests || !Array.isArray(manifests)) {
    res.status(400).json({ success: false, error: { code: 'MISSING_MANIFESTS', message: 'manifests array is required' } });
    return;
  }

  const results = manifests.map(validateKubernetesManifest);
  const allValid = results.every((r) => r.valid);

  res.json({
    success: true,
    data: { valid: allValid, results },
    meta: { requestId: uuidv4(), traceId: (req.headers['x-trace-id'] as string) ?? uuidv4(), timestamp: new Date().toISOString() },
  });
});

// POST /platform/supply-chain/verify - Verify image supply chain
router.post('/supply-chain/verify', async (req: Request, res: Response): Promise<void> => {
  const { image } = req.body as { image?: string };
  if (!image) {
    res.status(400).json({ success: false, error: { code: 'MISSING_IMAGE', message: 'image is required' } });
    return;
  }

  try {
    const result = await verifySupplyChain(image);
    res.json({
      success: true, data: result,
      meta: { requestId: uuidv4(), traceId: (req.headers['x-trace-id'] as string) ?? uuidv4(), timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error({ error, image }, 'Supply chain verification failed');
    res.status(500).json({ success: false, error: { code: 'VERIFY_FAILED', message: 'Supply chain verification failed' } });
  }
});

// POST /platform/deploy - Trigger GitOps deployment
router.post('/deploy', async (req: Request, res: Response): Promise<void> => {
  const { application, environment, imageTag } = req.body as { application?: string; environment?: string; imageTag?: string };
  if (!application || !environment || !imageTag) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'application, environment, and imageTag are required' } });
    return;
  }

  const validEnvironments = ['development', 'staging', 'production'];
  if (!validEnvironments.includes(environment)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_ENVIRONMENT', message: `environment must be one of: ${validEnvironments.join(', ')}` } });
    return;
  }

  try {
    const result = await triggerDeployment({ application, environment: environment as 'development' | 'staging' | 'production', imageTag });
    res.status(202).json({
      success: true, data: result,
      meta: { requestId: uuidv4(), traceId: (req.headers['x-trace-id'] as string) ?? uuidv4(), timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error({ error }, 'Deployment trigger failed');
    res.status(500).json({ success: false, error: { code: 'DEPLOY_FAILED', message: 'Deployment trigger failed' } });
  }
});

export default router;
