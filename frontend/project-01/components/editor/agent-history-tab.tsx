'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Bot,
  Globe,
  Search,
  FileText,
  History,
} from 'lucide-react';
import { useAgentStore } from '@/lib/stores/agent-store';
import { AGENT_CONFIGS, type AgentType } from '@/types/agents';
import { cn } from '@/lib/utils';

const AGENT_ICONS_SMALL: Record<AgentType, React.ReactNode> = {
  general: <Bot className="h-3.5 w-3.5" />,
  browser: <Globe className="h-3.5 w-3.5" />,
  search: <Search className="h-3.5 w-3.5" />,
  writing: <FileText className="h-3.5 w-3.5" />,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function duration(start?: string, end?: string): string {
  if (!start || !end) return '--';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  return `${mins}m ${remSecs}s`;
}

export function AgentHistoryTab() {
  const { taskHistory, replayTask, clearHistory, isRunning } = useAgentStore();

  if (taskHistory.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-4">
            <History className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <h3 className="font-semibold text-sm mb-1 text-muted-foreground">No History</h3>
          <p className="text-xs text-muted-foreground/70 max-w-[200px] mx-auto">
            Completed and cancelled agent tasks will show here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-4 py-2 border-b border-border flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {taskHistory.length} task{taskHistory.length !== 1 ? 's' : ''}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] text-muted-foreground hover:text-red-400"
          onClick={clearHistory}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1.5">
          {taskHistory.map((task) => {
            const config = AGENT_CONFIGS[task.agentType];
            return (
              <div
                key={task.id}
                className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className={cn(
                    'shrink-0 w-7 h-7 rounded-md flex items-center justify-center mt-0.5',
                    task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  )}>
                    {AGENT_ICONS_SMALL[task.agentType]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-400" />
                      )}
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {config.shortLabel}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">
                        {timeAgo(task.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-medium truncate mb-1">{task.title}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {duration(task.startedAt, task.completedAt)}
                      </span>
                      <span>{task.steps.length} steps</span>
                      <span>{task.artifacts.length} artifacts</span>
                    </div>
                    {task.error && (
                      <p className="text-[11px] text-red-400/80 mt-1 truncate">{task.error}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs shrink-0"
                    onClick={() => replayTask(task.id)}
                    disabled={isRunning}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Replay
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
