import { create } from 'zustand';
import type {
  AgentType,
  AgentTask,
  AgentArtifact,
  LogEntry,
  TaskStep,
} from '@/types/agents';

export type AgentTab = 'chat' | 'running' | 'artifacts' | 'history';

const AGENT_ROUTES: Record<AgentType, string> = {
  general: '/api/agents/orchestrator',
  browser: '/api/agents/browser',
  search: '/api/agents/search',
  writing: '/api/agents/writing',
};

interface AgentState {
  activeTab: AgentTab;
  selectedAgent: AgentType;
  currentTask: AgentTask | null;
  taskHistory: AgentTask[];
  allArtifacts: AgentArtifact[];
  isRunning: boolean;

  setActiveTab: (tab: AgentTab) => void;
  setSelectedAgent: (agent: AgentType) => void;
  startTask: (input: string) => void;
  pauseTask: () => void;
  resumeTask: () => void;
  cancelTask: () => void;
  completeTask: (output: string) => void;
  failTask: (error: string) => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  addArtifact: (artifact: Omit<AgentArtifact, 'id' | 'createdAt'>) => void;
  updateProgress: (progress: number) => void;
  addStep: (step: Omit<TaskStep, 'id'>) => void;
  updateStepStatus: (stepId: string, status: TaskStep['status'], output?: string) => void;
  replayTask: (taskId: string) => void;
  clearHistory: () => void;
}

let idCounter = 0;
function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${++idCounter}`;
}

async function executeAgentTask(store: AgentState, input: string) {
  const { selectedAgent, addLog, addStep, updateStepStatus, updateProgress, addArtifact, completeTask, failTask } = store;
  const route = AGENT_ROUTES[selectedAgent];

  addLog({ level: 'info', message: `Initializing ${selectedAgent} agent...`, agentType: selectedAgent });
  updateProgress(10);

  const planningStep: Omit<TaskStep, 'id'> = { label: 'Planning task', status: 'running' };
  addStep(planningStep);

  await new Promise((r) => setTimeout(r, 400));
  addLog({ level: 'info', message: 'Sending request to agent API...', agentType: selectedAgent });
  updateProgress(25);

  try {
    const response = await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });

    const currentTask = useAgentStore.getState().currentTask;
    if (!currentTask || currentTask.status !== 'running') return;

    const planStep = currentTask.steps[0];
    if (planStep) updateStepStatus(planStep.id, 'completed');
    updateProgress(40);

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }));
      addLog({ level: 'error', message: `API error: ${err.error || response.statusText}`, agentType: selectedAgent });
      failTask(err.error || 'Agent execution failed');
      return;
    }

    const data = await response.json();
    addLog({ level: 'success', message: 'Received response from agent', agentType: selectedAgent });
    updateProgress(60);

    if (data.steps && Array.isArray(data.steps)) {
      for (let i = 0; i < data.steps.length; i++) {
        const step: Omit<TaskStep, 'id'> = { label: data.steps[i], status: 'running' };
        addStep(step);
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

        const task = useAgentStore.getState().currentTask;
        if (!task || task.status !== 'running') return;

        const addedStep = task.steps[task.steps.length - 1];
        if (addedStep) updateStepStatus(addedStep.id, 'completed');

        const progressIncrement = (40 / data.steps.length);
        updateProgress(Math.min(95, 60 + progressIncrement * (i + 1)));

        addLog({ level: 'info', message: `Completed: ${data.steps[i]}`, agentType: selectedAgent });
      }
    }

    if (data.artifacts && Array.isArray(data.artifacts)) {
      for (const art of data.artifacts) {
        addArtifact({
          taskId: useAgentStore.getState().currentTask?.id || '',
          name: art.name || 'Output',
          type: art.type || 'text',
          content: art.content || '',
          size: (art.content || '').length,
        });
        addLog({ level: 'success', message: `Artifact created: ${art.name}`, agentType: selectedAgent });
      }
    }

    addLog({ level: 'success', message: 'Task completed successfully', agentType: selectedAgent });
    completeTask(data.result || 'Task completed');
  } catch (err) {
    addLog({ level: 'error', message: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, agentType: selectedAgent });
    failTask(err instanceof Error ? err.message : 'Unknown error');
  }
}

export const useAgentStore = create<AgentState>((set, get) => ({
  activeTab: 'chat',
  selectedAgent: 'general',
  currentTask: null,
  taskHistory: [],
  allArtifacts: [],
  isRunning: false,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  startTask: (input) => {
    const { selectedAgent } = get();
    const task: AgentTask = {
      id: genId('task'),
      agentType: selectedAgent,
      title: input.slice(0, 80) + (input.length > 80 ? '...' : ''),
      description: input,
      status: 'running',
      progress: 0,
      steps: [],
      input,
      artifacts: [],
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      logs: [{
        id: genId('log'),
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Starting ${selectedAgent} agent...`,
        agentType: selectedAgent,
      }],
    };
    set({ currentTask: task, isRunning: true, activeTab: 'running' });

    setTimeout(() => {
      executeAgentTask(get(), input);
    }, 200);
  },

  pauseTask: () => {
    const { currentTask } = get();
    if (!currentTask || currentTask.status !== 'running') return;
    set({
      currentTask: { ...currentTask, status: 'paused' },
      isRunning: false,
    });
  },

  resumeTask: () => {
    const { currentTask } = get();
    if (!currentTask || currentTask.status !== 'paused') return;
    set({
      currentTask: { ...currentTask, status: 'running' },
      isRunning: true,
    });
  },

  cancelTask: () => {
    const { currentTask, taskHistory } = get();
    if (!currentTask) return;
    const cancelled: AgentTask = {
      ...currentTask,
      status: 'failed',
      error: 'Cancelled by user',
      completedAt: new Date().toISOString(),
    };
    set({
      currentTask: null,
      taskHistory: [cancelled, ...taskHistory],
      isRunning: false,
    });
  },

  completeTask: (output) => {
    const { currentTask, taskHistory, allArtifacts } = get();
    if (!currentTask) return;
    const completed: AgentTask = {
      ...currentTask,
      status: 'completed',
      progress: 100,
      output,
      completedAt: new Date().toISOString(),
    };
    set({
      currentTask: null,
      taskHistory: [completed, ...taskHistory],
      allArtifacts: [...allArtifacts, ...completed.artifacts],
      isRunning: false,
    });
  },

  failTask: (error) => {
    const { currentTask, taskHistory } = get();
    if (!currentTask) return;
    const failed: AgentTask = {
      ...currentTask,
      status: 'failed',
      error,
      completedAt: new Date().toISOString(),
    };
    set({
      currentTask: null,
      taskHistory: [failed, ...taskHistory],
      isRunning: false,
    });
  },

  addLog: (log) => {
    const { currentTask } = get();
    if (!currentTask) return;
    const entry: LogEntry = {
      ...log,
      id: genId('log'),
      timestamp: new Date().toISOString(),
    };
    set({
      currentTask: {
        ...currentTask,
        logs: [...currentTask.logs, entry],
      },
    });
  },

  addArtifact: (artifact) => {
    const { currentTask } = get();
    if (!currentTask) return;
    const full: AgentArtifact = {
      ...artifact,
      id: genId('artifact'),
      createdAt: new Date().toISOString(),
    };
    set({
      currentTask: {
        ...currentTask,
        artifacts: [...currentTask.artifacts, full],
      },
    });
  },

  updateProgress: (progress) => {
    const { currentTask } = get();
    if (!currentTask) return;
    set({ currentTask: { ...currentTask, progress } });
  },

  addStep: (step) => {
    const { currentTask } = get();
    if (!currentTask) return;
    const full: TaskStep = { ...step, id: genId('step') };
    set({
      currentTask: {
        ...currentTask,
        steps: [...currentTask.steps, full],
      },
    });
  },

  updateStepStatus: (stepId, status, output) => {
    const { currentTask } = get();
    if (!currentTask) return;
    set({
      currentTask: {
        ...currentTask,
        steps: currentTask.steps.map((s) =>
          s.id === stepId
            ? { ...s, status, output: output || s.output, completedAt: status === 'completed' ? new Date().toISOString() : s.completedAt }
            : s
        ),
      },
    });
  },

  replayTask: (taskId) => {
    const { taskHistory } = get();
    const task = taskHistory.find((t) => t.id === taskId);
    if (!task) return;
    const { startTask } = get();
    startTask(task.input);
  },

  clearHistory: () => set({ taskHistory: [], allArtifacts: [] }),
}));
