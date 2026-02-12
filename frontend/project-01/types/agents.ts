export type AgentType = 'general' | 'browser' | 'search' | 'writing';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export type TaskStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface TaskStep {
  id: string;
  label: string;
  status: TaskStepStatus;
  startedAt?: string;
  completedAt?: string;
  output?: string;
  error?: string;
}

export interface AgentTask {
  id: string;
  agentType: AgentType;
  title: string;
  description: string;
  status: AgentStatus;
  progress: number;
  steps: TaskStep[];
  input: string;
  output?: string;
  artifacts: AgentArtifact[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  logs: LogEntry[];
}

export interface AgentArtifact {
  id: string;
  taskId: string;
  name: string;
  type: 'code' | 'text' | 'image' | 'file' | 'json';
  content: string;
  size: number;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  message: string;
  agentType: AgentType;
}

export interface AgentConfig {
  type: AgentType;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  color: string;
  capabilities: string[];
}

export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  general: {
    type: 'general',
    label: 'General Agent',
    shortLabel: 'General',
    description: 'Multi-step task execution with planning and parallelization',
    icon: 'Bot',
    color: 'emerald',
    capabilities: ['Task planning', 'Parallel execution', 'Code generation', 'Analysis'],
  },
  browser: {
    type: 'browser',
    label: 'Browser Operator',
    shortLabel: 'Browser',
    description: 'Automate web browsing, form filling, and data extraction',
    icon: 'Globe',
    color: 'sky',
    capabilities: ['Navigate websites', 'Fill forms', 'Extract data', 'Screenshots'],
  },
  search: {
    type: 'search',
    label: 'Search Agent',
    shortLabel: 'Search',
    description: 'Multi-engine parallel search with deep research',
    icon: 'Search',
    color: 'amber',
    capabilities: ['Web search', 'Result synthesis', 'Deep research', 'Citations'],
  },
  writing: {
    type: 'writing',
    label: 'Writing Agent',
    shortLabel: 'Writing',
    description: 'Generate articles, reports, and documentation',
    icon: 'FileText',
    color: 'rose',
    capabilities: ['Article generation', 'Reports', 'Documentation', 'Summaries'],
  },
};
