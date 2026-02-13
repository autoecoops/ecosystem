import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './middleware/logger';
import { traceMiddleware } from './middleware/auth.middleware';
import { metricsMiddleware, getMetrics } from './middleware/metrics';
import { initJwksClient } from './services/oidc.service';
import { startRBACSyncLoop, stopRBACSyncLoop } from './services/rbac.service';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';

// ============================================================================
// Application Bootstrap
// ============================================================================
const app = express();

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-trace-id', 'x-span-id', 'x-session-id'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Observability
app.use(traceMiddleware);
app.use(metricsMiddleware);
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/live' } }));

// Routes
app.use('/', healthRoutes);
app.use('/auth', authRoutes);

// Metrics endpoint (separate port in production)
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(await getMetrics());
});

// 404
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Resource not found' },
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next;
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.NODE_ENV === 'development' ? err.message : 'Internal server error',
    },
  });
});

// ============================================================================
// Server Startup
// ============================================================================
async function bootstrap(): Promise<void> {
  logger.info({ config: { port: config.PORT, env: config.NODE_ENV } }, 'Starting auth-service');

  initJwksClient();
  startRBACSyncLoop();

  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'auth-service listening');
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down auth-service');
    stopRBACSyncLoop();
    server.close(() => {
      logger.info('auth-service stopped');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start auth-service');
  process.exit(1);
});

export default app;
