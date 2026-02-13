import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './services/logger.service';
import platformRoutes from './routes/platform.routes';

const app = express();

app.use(helmet());
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',');
app.use(cors({
  origin: allowedOrigins ?? '*',
  credentials: Boolean(allowedOrigins),
}));
app.use(express.json({ limit: '10mb' }));
app.use(compression());
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

app.get('/health', (_req, res) => res.json({ status: 'healthy', version: config.VERSION, uptime: process.uptime() * 1000, timestamp: new Date().toISOString(), checks: {} }));
app.get('/ready', (_req, res) => res.json({ ready: true }));
app.get('/live', (_req, res) => res.json({ alive: true }));

app.use('/platform', platformRoutes);

app.use((_req, res) => { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } }); });
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});

async function bootstrap(): Promise<void> {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Starting platform-02 IAOps');
  const server = app.listen(config.PORT, () => { logger.info({ port: config.PORT }, 'platform-02 listening'); });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down platform-02');
    server.close(() => { process.exit(0); });
    setTimeout(() => process.exit(1), 10000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => { logger.fatal({ err }, 'Failed to start platform-02'); process.exit(1); });
export default app;
