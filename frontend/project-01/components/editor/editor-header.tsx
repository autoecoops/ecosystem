'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Code,
  Save,
  Play,
  Terminal as TerminalIcon,
  Share,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { useProjectStore } from '@/lib/stores/project-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';

interface EditorHeaderProps {
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
}

export function EditorHeader({ isTerminalOpen, onToggleTerminal }: EditorHeaderProps) {
  const router = useRouter();
  const { currentProject, currentFile, files } = useProjectStore();
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!currentProject || !currentFile) return;

    setIsSaving(true);
    try {
      const updatedFiles: Record<string, string> = {};
      Object.entries(files).forEach(([path, file]) => {
        updatedFiles[path] = file.content;
      });

      const response = await fetch(`/api/projects/${currentProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: updatedFiles,
        }),
      });

      if (response.ok) {
        toast.success('Project saved successfully!');
      } else {
        toast.error('Failed to save project');
      }
    } catch (error) {
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!currentFile || !files[currentFile]) return;

    setIsRunning(true);
    try {
      const file = files[currentFile];
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: file.content,
          language: file.language,
        }),
      });

      if (response.ok) {
        toast.success('Code executed successfully!');
        // You could display the output in the terminal or a modal
      } else {
        toast.error('Failed to execute code');
      }
    } catch (error) {
      toast.error('Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5 text-blue-500" />
            <span className="font-semibold">{currentProject?.name}</span>
            {currentProject?.language && (
              <Badge variant="secondary" className="text-xs">
                {currentProject.language}
              </Badge>
            )}
          </div>
          
          {currentFile && (
            <div className="text-sm text-muted-foreground">
              {currentFile}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRun}
            disabled={isRunning || !currentFile}
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggleTerminal}
            className={isTerminalOpen ? 'bg-muted' : ''}
          >
            <TerminalIcon className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Share className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}