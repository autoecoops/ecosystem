'use client';

import { useAgentStore, type AgentTab } from '@/lib/stores/agent-store';
import { AGENT_CONFIGS, type AgentType } from '@/types/agents';
import { Bot, Globe, Search, FileText, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentChatTab } from './agent-chat-tab';
import { AgentRunningTab } from './agent-running-tab';
import { AgentArtifactsTab } from './agent-artifacts-tab';
import { AgentHistoryTab } from './agent-history-tab';

const AGENT_ICONS: Record<AgentType, React.ReactNode> = {
  general: <Bot className="h-3.5 w-3.5" />,
  browser: <Globe className="h-3.5 w-3.5" />,
  search: <Search className="h-3.5 w-3.5" />,
  writing: <FileText className="h-3.5 w-3.5" />,
};

const AGENT_COLORS: Record<AgentType, string> = {
  general: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
  browser: 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20',
  search: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
  writing: 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20',
};

const AGENT_ACTIVE_COLORS: Record<AgentType, string> = {
  general: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50 shadow-emerald-500/10 shadow-sm',
  browser: 'bg-sky-500/25 text-sky-300 border-sky-400/50 shadow-sky-500/10 shadow-sm',
  search: 'bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-amber-500/10 shadow-sm',
  writing: 'bg-rose-500/25 text-rose-300 border-rose-400/50 shadow-rose-500/10 shadow-sm',
};

const TABS: { key: AgentTab; label: string }[] = [
  { key: 'chat', label: 'Chat' },
  { key: 'running', label: 'Running' },
  { key: 'artifacts', label: 'Artifacts' },
  { key: 'history', label: 'History' },
];

export function AgentPanel() {
  const { activeTab, setActiveTab, selectedAgent, setSelectedAgent, isRunning } = useAgentStore();

  return (
    <div className="h-full flex flex-col bg-card/80 backdrop-blur-sm border-l border-border overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <Zap className="h-5 w-5 text-sky-400" />
            {isRunning && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
          <h2 className="text-lg font-bold tracking-tight">Agents</h2>
          {isRunning && (
            <span className="ml-auto text-[10px] font-medium uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Active
            </span>
          )}
        </div>

        <div className="flex gap-1.5 mb-3">
          {(Object.keys(AGENT_CONFIGS) as AgentType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedAgent(type)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all duration-200',
                selectedAgent === type ? AGENT_ACTIVE_COLORS[type] : AGENT_COLORS[type]
              )}
            >
              {AGENT_ICONS[type]}
              <span>{AGENT_CONFIGS[type].shortLabel}</span>
            </button>
          ))}
        </div>

        <div className="flex border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 text-xs font-medium py-2 relative transition-colors',
                activeTab === tab.key
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/70'
              )}
            >
              {tab.label}
              {tab.key === 'running' && isRunning && (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-sky-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <AgentChatTab />}
        {activeTab === 'running' && <AgentRunningTab />}
        {activeTab === 'artifacts' && <AgentArtifactsTab />}
        {activeTab === 'history' && <AgentHistoryTab />}
      </div>
    </div>
  );
}
