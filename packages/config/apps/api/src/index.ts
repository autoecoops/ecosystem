import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config({ path: '.env.local' });
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// ============================================================================
// 中間件配置
// ============================================================================

// 安全性
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
}));

// 請求解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 壓縮
app.use(compression());

// 日誌
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================================================
// 健康檢查
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    services: {
      database: 'checking...',
      redis: 'checking...',
      ai: 'checking...'
    }
  });
});

// ============================================================================
// API 路由 (待實作)
// ============================================================================

app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Contracts-L1 API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      docs: '/api-docs',
      auth: '/api/auth',
      contracts: '/api/contracts'
    }
  });
});

// TODO: 實作路由
// app.use('/api/auth', authRoutes);
// app.use('/api/contracts', contractRoutes);
// app.use('/api/analysis', analysisRoutes);

// ============================================================================
// 錯誤處理
// ============================================================================

// 404 處理
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// 全域錯誤處理
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============================================================================
// 啟動伺服器
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Contracts-L1 API Server Started     ║
╠════════════════════════════════════════╣
║  Environment: ${process.env.NODE_ENV?.padEnd(24) || 'development'.padEnd(24)}║
║  Port:        ${String(PORT).padEnd(24)}║
║  URL:         http://localhost:${PORT}    ║
╚════════════════════════════════════════╝
  `);
});

export default app;
