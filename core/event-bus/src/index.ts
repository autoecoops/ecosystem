import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './middleware/logger';
import { initRedis, getRedis, shutdownRedis } from './producers/stream.producer';
import eventRoutes from './routes/event.routes';
import type { HealthCheck } from '@autoecops/shared-types';

const app = express();

app.use(helmet());
const allowedOrigins = process.env.ALLOWED_ORIGINS;
app.use(cors({
  origin: allowedOrigins?.split(',') ?? '*',
  credentials: Boolean(allowedOrigins),
}));
app.use(express.json({ limit: '5mb' }));
app.use(compression());
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

// Health
app.get('/health', async (_req, res) => {
  const start = Date.now();
  let redisStatus: 'healthy' | 'unhealthy' = 'unhealthy';
  try {
    await getRedis().ping();
    redisStatus = 'healthy';
  } catch { /* noop */ }

  const health: HealthCheck = {
    status: redisStatus,
    version: config.VERSION,
    uptime: process.uptime() * 1000,
    timestamp: new Date().toISOString(),
    checks: { redis: { status: redisStatus, latencyMs: Date.now() - start } },
  };
  res.status(redisStatus === 'healthy' ? 200 : 503).json(health);
});

app.get('/ready', async (_req, res) => {
  try { await getRedis().ping(); res.json({ ready: true }); } catch { res.status(503).json({ ready: false }); }
});

app.get('/live', (_req, res) => res.json({ alive: true }));

// Routes
app.use('/events', eventRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next;
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});

async function bootstrap(): Promise<void> {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Starting event-bus');
  initRedis();

  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'event-bus listening');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down event-bus');
    server.close(async () => {
      await shutdownRedis();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => { logger.fatal({ err }, 'Failed to start event-bus'); process.exit(1); });

export default app;
