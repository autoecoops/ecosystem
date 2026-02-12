'use client';

import { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '@/lib/stores/project-store';
import { useTheme } from 'next-themes';

export function MonacoEditor() {
  const { currentFile, files, updateFile } = useProjectStore();
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);

  const currentFileData = currentFile ? files[currentFile] : null;

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure Monaco Editor
    monaco.editor.defineTheme('dark-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#ffffff',
        'editorLineNumber.foreground': '#666666',
        'editorCursor.foreground': '#ffffff',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#1a1a1a',
      },
    });

    monaco.editor.setTheme('dark-theme');

    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Handle save
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (currentFile && value !== undefined) {
      updateFile(currentFile, value);
    }
  };

  if (!currentFileData) {
    return (
      <div className="h-full flex items-center justify-center bg-background text-muted-foreground">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No file selected</h3>
          <p>Select a file from the explorer to start coding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Editor
        height="100%"
        language={currentFileData.language}
        value={currentFileData.content}
        theme={theme === 'dark' ? 'dark-theme' : 'light'}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
          minimap: { enabled: true },
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: true,
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always',
          unfoldOnClickAfterEndOfLine: false,
          contextmenu: true,
          mouseWheelZoom: true,
          cursorSmoothCaretAnimation: 'on',
          cursorBlinking: 'smooth',
          renderWhitespace: 'selection',
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
      />
    </div>
  );
}