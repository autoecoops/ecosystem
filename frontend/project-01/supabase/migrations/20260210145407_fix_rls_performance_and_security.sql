/*
  # Fix RLS Performance and Security Issues

  ## Changes
  
  1. **Optimize RLS Policies**
     - Replace `auth.uid()` with `(select auth.uid())` to prevent re-evaluation per row
     - Apply to projects table only (other tables don't exist in this migration set)
  
  2. **Fix Function Search Paths**
     - Set stable search paths for functions
  
  ## Performance Impact
  
  - Significantly improves query performance at scale
  - Reduces function calls from O(n) to O(1) per query
  - Follows Supabase best practices
*/

-- First, drop all existing RLS policies that need to be fixed

-- Projects table policies
DROP POLICY IF EXISTS "Users can read own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Now create optimized policies with (select auth.uid())

-- Projects table - OPTIMIZED
CREATE POLICY "Users can read own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix function search paths for security
ALTER FUNCTION update_updated_at_column() SET search_path = pg_catalog, public;
