/*
  # Index Management and Extension Organization

  1. Index Review
    - Keep `idx_projects_user_id` and `idx_projects_updated_at` as they are used by API queries
    - Only drop indexes for tables that don't exist yet
  
  2. Extension Changes
    - Conditionally move `vector` extension from `public` schema to `extensions` schema only if it exists
  
  3. Notes
    - Indexes on projects table are kept because they support actual queries in app/api/projects/route.ts
    - Query pattern: SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC
    - Extension move is conditional to prevent migration failures
*/

-- Ensure the extensions schema exists and only move vector if needed
DO $$
DECLARE
  current_schema name;
BEGIN
  -- Only proceed if the vector extension exists
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    -- Look up the current schema of the vector extension
    SELECT n.nspname
      INTO current_schema
      FROM pg_extension e
      JOIN pg_namespace n ON n.oid = e.extnamespace
     WHERE e.extname = 'vector';

    -- Only move the extension if it is not already in the extensions schema
    IF current_schema IS DISTINCT FROM 'extensions' THEN
      -- Create the target schema if it does not already exist
      CREATE SCHEMA IF NOT EXISTS extensions;
      -- Move vector extension to the extensions schema
      EXECUTE 'ALTER EXTENSION vector SET SCHEMA extensions';
    END IF;
  END IF;
END $$;
