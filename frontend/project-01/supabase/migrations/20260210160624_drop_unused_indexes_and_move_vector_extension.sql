/*
  # Drop unused indexes and move vector extension

  1. Dropped Indexes
    - `idx_document_chunks_embedding` on `document_chunks` (unused HNSW vector index)
    - `idx_projects_user_id` on `projects` (unused)
    - `idx_projects_updated_at` on `projects` (unused)
    - `idx_knowledge_bases_user_id` on `knowledge_bases` (unused)
    - `idx_documents_knowledge_base_id` on `documents` (unused)
    - `idx_document_chunks_document_id` on `document_chunks` (unused)
    - `idx_agent_tasks_user_id` on `agent_tasks` (unused)
    - `idx_agent_tasks_status` on `agent_tasks` (unused)

  2. Extension Changes
    - Moved `vector` extension from `public` schema to `extensions` schema

  3. Notes
    - All 8 indexes were confirmed unused by the Supabase advisor
    - Indexes can be recreated later if query patterns require them
    - The `extensions` schema already exists in this project
    - Existing columns using the vector type will continue to work after the move
*/

-- Drop all unused indexes
DROP INDEX IF EXISTS public.idx_document_chunks_embedding;
DROP INDEX IF EXISTS public.idx_projects_user_id;
DROP INDEX IF EXISTS public.idx_projects_updated_at;
DROP INDEX IF EXISTS public.idx_knowledge_bases_user_id;
DROP INDEX IF EXISTS public.idx_documents_knowledge_base_id;
DROP INDEX IF EXISTS public.idx_document_chunks_document_id;
DROP INDEX IF EXISTS public.idx_agent_tasks_user_id;
DROP INDEX IF EXISTS public.idx_agent_tasks_status;

-- Move vector extension from public to extensions schema
ALTER EXTENSION vector SET SCHEMA extensions;
