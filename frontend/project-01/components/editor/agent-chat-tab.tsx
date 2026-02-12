'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Sparkles,
  Code,
  RefreshCw,
  Bug,
  Copy,
  Bot,
  ArrowRight,
} from 'lucide-react';
import { useAIStore, type ChatMessage } from '@/lib/stores/ai-store';
import { useAgentStore } from '@/lib/stores/agent-store';
import { useProjectStore } from '@/lib/stores/project-store';
import { AGENT_CONFIGS } from '@/types/agents';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AgentChatTab() {
  const { messages, isLoading, addMessage, setLoading } = useAIStore();
  const { selectedAgent, startTask, isRunning: agentRunning } = useAgentStore();
  const { currentFile, files } = useProjectStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const config = AGENT_CONFIGS[selectedAgent];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const sendMessage = async (message: string, type: 'chat' | 'explain' | 'refactor' | 'debug' | 'complete' = 'chat') => {
    if (!message.trim()) return;

    setLoading(true);
    addMessage({ role: 'user', content: message });
    setInput('');

    try {
      const context = currentFile && files[currentFile] ? {
        code: files[currentFile].content,
        language: files[currentFile].language,
        fileName: currentFile,
      } : undefined;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context, type }),
      });

      if (response.ok) {
        const data = await response.json();
        addMessage({ role: 'assistant', content: data.response });
      } else {
        toast.error('Failed to get AI response');
      }
    } catch {
      toast.error('Failed to communicate with AI');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleRunAsAgent = () => {
    if (!input.trim()) return;
    startTask(input);
    setInput('');
  };

  const handleQuickAction = (action: string) => {
    if (!currentFile || !files[currentFile]) {
      toast.error('Select a file first');
      return;
    }
    const actions: Record<string, { message: string; type: 'explain' | 'refactor' | 'debug' | 'complete' }> = {
      explain: { message: 'Explain this code', type: 'explain' },
      refactor: { message: 'Suggest improvements for this code', type: 'refactor' },
      debug: { message: 'Help me debug this code', type: 'debug' },
      complete: { message: 'Complete this code', type: 'complete' },
    };
    const cfg = actions[action];
    if (cfg) sendMessage(cfg.message, cfg.type);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-3 py-2 border-b border-border">
        <div className="flex gap-1.5">
          {[
            { key: 'explain', icon: <Sparkles className="h-3 w-3" />, label: 'Explain' },
            { key: 'refactor', icon: <RefreshCw className="h-3 w-3" />, label: 'Refactor' },
            { key: 'debug', icon: <Bug className="h-3 w-3" />, label: 'Debug' },
            { key: 'complete', icon: <Code className="h-3 w-3" />, label: 'Complete' },
          ].map((a) => (
            <button
              key={a.key}
              onClick={() => handleQuickAction(a.key)}
              disabled={!currentFile || isLoading}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40"
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-6 w-6 text-sky-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1">
                {config.label} Ready
              </h3>
              <p className="text-xs text-muted-foreground max-w-[220px] mx-auto leading-relaxed">
                {config.description}
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                {config.capabilities.map((cap) => (
                  <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} onCopy={copyToClipboard} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground px-1">
              <Bot className="h-3.5 w-3.5 text-sky-400" />
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 p-3 border-t border-border">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${config.shortLabel} agent...`}
              disabled={isLoading}
              rows={1}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 disabled:opacity-50"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 bottom-1.5 h-7 w-7 p-0 rounded-md"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <button
            type="button"
            onClick={handleRunAsAgent}
            disabled={!input.trim() || agentRunning}
            className="flex items-center gap-1.5 text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowRight className="h-3 w-3" />
            Run as {config.shortLabel} Agent task
          </button>
        </form>
      </div>
    </div>
  );
}

function ChatBubble({ message, onCopy }: { message: ChatMessage; onCopy: (t: string) => void }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[85%] rounded-lg px-3 py-2',
        isUser
          ? 'bg-sky-600/90 text-white'
          : 'bg-muted/80 border border-border'
      )}>
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={cn(
            'text-[10px] font-medium uppercase tracking-wider',
            isUser ? 'text-sky-200' : 'text-muted-foreground'
          )}>
            {isUser ? 'You' : 'AI'}
          </span>
          <button
            onClick={() => onCopy(message.content)}
            className={cn(
              'opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity p-0.5 rounded',
              isUser ? 'text-sky-200 hover:text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
      </div>
    </div>
  );
}
