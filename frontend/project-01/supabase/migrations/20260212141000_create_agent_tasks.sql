/*
  # Create agent_tasks table

  1. New Tables
    - `agent_tasks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `agent_type` (text, type of agent: general, browser, search, writing)
      - `task_type` (text, specific task type)
      - `input` (jsonb, input data for the task)
      - `output` (jsonb, output/result data)
      - `status` (text, task status: queued, running, completed, failed)
      - `started_at` (timestamptz, when task started)
      - `completed_at` (timestamptz, when task completed)
      - `created_at` (timestamptz, when record created)
      - `updated_at` (timestamptz, when record updated)

  2. Security
    - Enable RLS on `agent_tasks` table
    - Add policies for authenticated users to manage their own tasks
*/

-- Create agent_tasks table
CREATE TABLE IF NOT EXISTS agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_type text NOT NULL,
  task_type text NOT NULL,
  input jsonb DEFAULT '{}',
  output jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

-- Create optimized RLS policies (using (select auth.uid()) pattern)
CREATE POLICY "Users can view own agent tasks"
  ON agent_tasks FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own agent tasks"
  ON agent_tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own agent tasks"
  ON agent_tasks FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own agent tasks"
  ON agent_tasks FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Create updated_at trigger (function already exists from earlier migration)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    EXECUTE '
      CREATE TRIGGER update_agent_tasks_updated_at
        BEFORE UPDATE ON agent_tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    ';
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_id ON agent_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at ON agent_tasks(created_at DESC);
