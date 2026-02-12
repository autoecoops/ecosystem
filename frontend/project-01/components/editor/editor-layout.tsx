'use client';

import { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { FileExplorer } from './file-explorer';
import { MonacoEditor } from './monaco-editor';
import { AgentPanel } from './agent-panel';
import { EditorHeader } from './editor-header';
import { Terminal } from './terminal';
import { useProjectStore } from '@/lib/stores/project-store';

export function EditorLayout() {
  const { currentProject, currentFile } = useProjectStore();
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorHeader
        isTerminalOpen={isTerminalOpen}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={18} minSize={14} maxSize={30}>
            <FileExplorer />
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={48} minSize={25}>
            <div className="h-full flex flex-col">
              <div className={`flex-1 ${isTerminalOpen ? 'h-1/2' : ''}`}>
                {currentFile ? (
                  <MonacoEditor />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Welcome to autoecoops</h3>
                      <p>Select a file from the explorer to start coding</p>
                    </div>
                  </div>
                )}
              </div>

              {isTerminalOpen && (
                <>
                  <ResizableHandle />
                  <div className="h-1/2">
                    <Terminal />
                  </div>
                </>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={34} minSize={24} maxSize={50}>
            <AgentPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
