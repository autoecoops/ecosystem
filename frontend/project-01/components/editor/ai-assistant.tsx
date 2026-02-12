'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Send,
  Sparkles,
  Code,
  RefreshCw,
  Bug,
  X,
  Copy,
} from 'lucide-react';
import { useAIStore, type ChatMessage } from '@/lib/stores/ai-store';
import { useProjectStore } from '@/lib/stores/project-store';
import { toast } from 'sonner';

export function AIAssistant() {
  const { messages, isLoading, addMessage, setLoading, toggleOpen } = useAIStore();
  const { currentFile, files } = useProjectStore();
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (message: string, type: 'chat' | 'explain' | 'refactor' | 'debug' | 'complete' = 'chat') => {
    if (!message.trim()) return;

    setLoading(true);
    addMessage({ role: 'user', content: message });

    try {
      const context = currentFile && files[currentFile] ? {
        code: files[currentFile].content,
        language: files[currentFile].language,
        fileName: currentFile,
      } : undefined;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          type,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addMessage({ role: 'assistant', content: data.response });
      } else {
        toast.error('Failed to get AI response');
      }
    } catch (error) {
      toast.error('Failed to communicate with AI');
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (action: string) => {
    if (!currentFile || !files[currentFile]) {
      toast.error('Please select a file first');
      return;
    }

    const actions: Record<string, { message: string; type: 'explain' | 'refactor' | 'debug' | 'complete' }> = {
      explain: {
        message: 'Explain this code',
        type: 'explain',
      },
      refactor: {
        message: 'Suggest improvements for this code',
        type: 'refactor',
      },
      debug: {
        message: 'Help me debug this code',
        type: 'debug',
      },
      complete: {
        message: 'Complete this code',
        type: 'complete',
      },
    };

    const actionConfig = actions[action];
    if (actionConfig) {
      sendMessage(actionConfig.message, actionConfig.type);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="h-full bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-blue-500" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleOpen}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('explain')}
            disabled={!currentFile || isLoading}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Explain
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('refactor')}
            disabled={!currentFile || isLoading}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refactor
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('debug')}
            disabled={!currentFile || isLoading}
          >
            <Bug className="h-3 w-3 mr-1" />
            Debug
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('complete')}
            disabled={!currentFile || isLoading}
          >
            <Code className="h-3 w-3 mr-1" />
            Complete
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">AI Assistant Ready</h3>
              <p className="text-sm">
                Ask questions about your code or use the quick actions above.
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onCopy={copyToClipboard}
            />
          ))}
          
          {isLoading && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Bot className="h-4 w-4" />
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your code..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ 
  message, 
  onCopy 
}: { 
  message: ChatMessage;
  onCopy: (text: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-lg p-3 ${
        isUser 
          ? 'bg-blue-500 text-white ml-8' 
          : 'bg-muted mr-8'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <Badge variant={isUser ? 'secondary' : 'outline'} className="text-xs">
            {isUser ? 'You' : 'AI'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
            onClick={() => onCopy(message.content)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}