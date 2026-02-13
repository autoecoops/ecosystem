import { Pool, PoolClient } from 'pg';
import { config } from '../config';
import { logger } from './logger.service';

let pool: Pool;

export async function initDatabase(): Promise<void> {
  // Validate config values before using in SQL
  if (!Number.isInteger(config.EMBEDDING_DIMENSIONS) || config.EMBEDDING_DIMENSIONS <= 0) {
    throw new Error(`Invalid EMBEDDING_DIMENSIONS: ${config.EMBEDDING_DIMENSIONS}`);
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(config.EMBEDDING_MODEL_VERSION)) {
    throw new Error(`Invalid EMBEDDING_MODEL_VERSION: ${config.EMBEDDING_MODEL_VERSION}`);
  }

  pool = new Pool({
    connectionString: config.DATABASE_URL,
    min: config.DB_POOL_MIN,
    max: config.DB_POOL_MAX,
    ssl: config.DB_SSL ? { rejectUnauthorized: false } : false,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected database pool error');
  });

  const client = await pool.connect();
  try {
    // Enable required extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    // Create documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        source TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        scan_status TEXT DEFAULT 'pending' CHECK (scan_status IN ('pending', 'clean', 'infected', 'error')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create chunks table with vector column
    // Using validated config values - dimensions is integer, version is alphanumeric
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        embedding vector(${config.EMBEDDING_DIMENSIONS}),
        chunk_index INTEGER NOT NULL,
        total_chunks INTEGER NOT NULL,
        model_version TEXT NOT NULL DEFAULT '${config.EMBEDDING_MODEL_VERSION}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create vector similarity index (IVFFlat for production scale)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chunks_embedding
      ON document_chunks
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `).catch(() => {
      // IVFFlat requires data to build; fall back to HNSW
      return client.query(`
        CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
        ON document_chunks
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
      `);
    });

    // Audit log for model version changes
    await client.query(`
      CREATE TABLE IF NOT EXISTS embedding_model_audit (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        previous_version TEXT NOT NULL,
        new_version TEXT NOT NULL,
        changed_by TEXT NOT NULL,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    logger.info('Database initialized with pgvector');
  } finally {
    client.release();
  }
}

export function getPool(): Pool {
  return pool;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function healthCheck(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch {
    return { status: 'unhealthy', latencyMs: Date.now() - start };
  }
}

export async function shutdownDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
  }
}
