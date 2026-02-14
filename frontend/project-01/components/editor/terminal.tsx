'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Terminal as TerminalIcon, Play } from 'lucide-react';

interface TerminalLine {
  id: string;
  content: string;
  type: 'command' | 'output' | 'error';
  timestamp: Date;
}

export function Terminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '1',
      content: 'Welcome to machops Terminal',
      type: 'output',
      timestamp: new Date(),
    },
    {
      id: '2',
      content: 'Type commands to interact with your project',
      type: 'output',
      timestamp: new Date(),
    },
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = (content: string, type: TerminalLine['type']) => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date(),
    };
    setLines(prev => [...prev, newLine]);
  };

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Add command line
    addLine(`$ ${command}`, 'command');

    // Simulate command execution
    try {
      switch (command.toLowerCase().trim()) {
        case 'help':
          addLine('Available commands:', 'output');
          addLine('  help     - Show this help message', 'output');
          addLine('  clear    - Clear terminal', 'output');
          addLine('  ls       - List files', 'output');
          addLine('  pwd      - Show current directory', 'output');
          addLine('  echo     - Echo text', 'output');
          break;

        case 'clear':
          setLines([]);
          break;

        case 'ls':
          addLine('Files in current project:', 'output');
          addLine('  main.js', 'output');
          addLine('  package.json', 'output');
          addLine('  README.md', 'output');
          break;

        case 'pwd':
          addLine('/workspace/project', 'output');
          break;

        default:
          if (command.startsWith('echo ')) {
            const text = command.substring(5);
            addLine(text, 'output');
          } else {
            addLine(`Command not found: ${command}`, 'error');
            addLine('Type "help" for available commands', 'output');
          }
      }
    } catch (error) {
      addLine(`Error executing command: ${error}`, 'error');
    }

    setCurrentCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      case 'output':
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="h-full bg-background border-t border-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-semibold">Terminal</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLines([])}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-4 font-mono text-sm" ref={viewportRef}>
          <div className="space-y-1">
            {lines.map((line) => (
              <div
                key={line.id}
                className={`${getLineColor(line.type)} whitespace-pre-wrap`}
              >
                {line.content}
              </div>
            ))}
          </div>
        </div>

        {/* Command Input */}
        <div className="border-t border-border p-4">
          <div className="flex items-center space-x-2 font-mono text-sm">
            <span className="text-blue-400 shrink-0">$</span>
            <Input
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 font-mono"
              placeholder="Type a command..."
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => executeCommand(currentCommand)}
              disabled={!currentCommand.trim()}
            >
              <Play className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}