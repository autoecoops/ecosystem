-- AutoEcoOps Ecosystem Database Initialization
-- This script runs on first PostgreSQL container start

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create separate databases for services
CREATE DATABASE memory_hub;
CREATE DATABASE policy_audit;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE memory_hub TO postgres;
GRANT ALL PRIVILEGES ON DATABASE policy_audit TO postgres;

-- Enable extensions in memory_hub
\c memory_hub
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable extensions in policy_audit
\c policy_audit
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
