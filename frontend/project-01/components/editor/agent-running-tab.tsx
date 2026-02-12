'use client';

import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Pause,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Info,
  Bug,
  Zap,
} from 'lucide-react';
import { useAgentStore } from '@/lib/stores/agent-store';
import { AGENT_CONFIGS } from '@/types/agents';
import type { LogEntry, TaskStep } from '@/types/agents';
import { cn } from '@/lib/utils';

const LOG_ICONS: Record<LogEntry['level'], React.ReactNode> = {
  info: <Info className="h-3 w-3 text-sky-400" />,
  warn: <AlertTriangle className="h-3 w-3 text-amber-400" />,
  error: <XCircle className="h-3 w-3 text-red-400" />,
  debug: <Bug className="h-3 w-3 text-zinc-400" />,
  success: <CheckCircle2 className="h-3 w-3 text-emerald-400" />,
};

const LOG_COLORS: Record<LogEntry['level'], string> = {
  info: 'text-sky-300/90',
  warn: 'text-amber-300/90',
  error: 'text-red-300/90',
  debug: 'text-zinc-400',
  success: 'text-emerald-300/90',
};

const STEP_ICONS: Record<TaskStep['status'], React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5 text-zinc-500" />,
  running: <Loader2 className="h-3.5 w-3.5 text-sky-400 animate-spin" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  failed: <XCircle className="h-3.5 w-3.5 text-red-400" />,
  skipped: <Clock className="h-3.5 w-3.5 text-zinc-600" />,
};

export function AgentRunningTab() {
  const {
    currentTask,
    isRunning,
    pauseTask,
    resumeTask,
    cancelTask,
  } = useAgentStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentTask?.logs.length]);

  if (!currentTask) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-4">
            <Zap className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <h3 className="font-semibold text-sm mb-1 text-muted-foreground">No Active Task</h3>
          <p className="text-xs text-muted-foreground/70 max-w-[200px] mx-auto">
            Start a task from the Chat tab to see real-time execution here
          </p>
        </div>
      </div>
    );
  }

  const config = AGENT_CONFIGS[currentTask.agentType];
  const isPaused = currentTask.status === 'paused';

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-4 py-3 border-b border-border space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={cn(
                'text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-sm',
                currentTask.status === 'running' && 'bg-emerald-500/10 text-emerald-400',
                currentTask.status === 'paused' && 'bg-amber-500/10 text-amber-400',
                currentTask.status === 'completed' && 'bg-sky-500/10 text-sky-400',
                currentTask.status === 'failed' && 'bg-red-500/10 text-red-400',
              )}>
                {currentTask.status}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {config.shortLabel}
              </span>
            </div>
            <p className="text-sm font-medium truncate">{currentTask.title}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-mono text-muted-foreground">{currentTask.progress}%</span>
          </div>
          <Progress value={currentTask.progress} className="h-1.5" />
        </div>

        <div className="flex gap-1.5">
          {isRunning || isPaused ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={isPaused ? resumeTask : pauseTask}
                className="flex-1 h-7 text-xs"
              >
                {isPaused ? (
                  <><Play className="h-3 w-3 mr-1" /> Resume</>
                ) : (
                  <><Pause className="h-3 w-3 mr-1" /> Pause</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelTask}
                className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
              >
                <Square className="h-3 w-3 mr-1" /> Stop
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => useAgentStore.getState().replayTask(currentTask.id)}
              className="flex-1 h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Replay
            </Button>
          )}
        </div>
      </div>

      {currentTask.steps.length > 0 && (
        <div className="shrink-0 px-4 py-2 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Steps</p>
          <div className="space-y-1">
            {currentTask.steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2">
                {STEP_ICONS[step.status]}
                <span className={cn(
                  'text-xs',
                  step.status === 'completed' && 'text-muted-foreground line-through',
                  step.status === 'running' && 'text-foreground font-medium',
                  step.status === 'pending' && 'text-muted-foreground',
                  step.status === 'failed' && 'text-red-400',
                  step.status === 'skipped' && 'text-muted-foreground/50',
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <div className="px-4 py-2 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Execution Log
            <span className="ml-1.5 text-muted-foreground/50">({currentTask.logs.length})</span>
          </p>
        </div>
        <ScrollArea className="flex-1 h-[calc(100%-28px)]">
          <div className="px-3 py-2 space-y-0.5 font-mono text-[11px]">
            {currentTask.logs.map((log) => (
              <div key={log.id} className="flex items-start gap-1.5 py-0.5">
                <span className="shrink-0 mt-0.5">{LOG_ICONS[log.level]}</span>
                <span className="text-muted-foreground/50 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                </span>
                <span className={LOG_COLORS[log.level]}>{log.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </ScrollArea>
      </div>

      {currentTask.error && (
        <div className="shrink-0 px-4 py-2 border-t border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-2">
            <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{currentTask.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
