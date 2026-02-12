'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { File, Plus, FileText, Trash2 } from 'lucide-react';
import { useProjectStore } from '@/lib/stores/project-store';
import type { File as FileType } from '@/lib/stores/project-store';
import { toast } from 'sonner';

export function FileExplorer() {
  const {
    currentProject,
    files,
    currentFile,
    setCurrentFile,
    addFile,
    deleteFile,
  } = useProjectStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;

    if (files[newFileName]) {
      toast.error('File already exists');
      return;
    }

    const extension = newFileName.split('.').pop() || '';
    const language = getLanguageFromExtension(extension);

    const newFile: FileType = {
      name: newFileName,
      content: getTemplateContent(language),
      language,
      path: newFileName,
    };

    addFile(newFile);
    setCurrentFile(newFileName);
    setIsCreating(false);
    setNewFileName('');
    toast.success('File created successfully!');
  };

  const handleDeleteFile = (fileName: string) => {
    deleteFile(fileName);
    if (currentFile === fileName) {
      setCurrentFile(null);
    }
    toast.success('File deleted successfully!');
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'py':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'go':
        return <FileText className="h-4 w-4 text-cyan-500" />;
      case 'rs':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'html':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'css':
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!currentProject) {
    return (
      <div className="h-full bg-card border-r border-border">
        <div className="p-4 text-center text-muted-foreground">
          No project selected
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-card border-r border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Files</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-2 space-y-1">
        {isCreating && (
          <div className="flex items-center space-x-2 p-2">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.ext"
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile();
                } else if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFileName('');
                }
              }}
            />
          </div>
        )}
        
        {Object.entries(files).map(([fileName, file]) => (
          <ContextMenu key={fileName}>
            <ContextMenuTrigger>
              <div
                className={`flex items-center space-x-2 p-2 rounded text-sm cursor-pointer hover:bg-muted/50 ${
                  currentFile === fileName ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
                onClick={() => setCurrentFile(fileName)}
              >
                {getFileIcon(fileName)}
                <span className="flex-1 truncate">{file.name}</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => handleDeleteFile(fileName)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
        
        {Object.keys(files).length === 0 && !isCreating && (
          <div className="text-center text-muted-foreground p-4">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files yet</p>
            <p className="text-xs">Click + to create a file</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    swift: 'swift',
    kt: 'kotlin',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
  };

  return languageMap[extension] || 'plaintext';
}

function getTemplateContent(language: string): string {
  const templates: Record<string, string> = {
    javascript: '// Welcome to AIForge!\nconsole.log("Hello, World!");',
    typescript: '// Welcome to AIForge!\nconsole.log("Hello, World!");',
    python: '# Welcome to AIForge!\nprint("Hello, World!")',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
    rust: 'fn main() {\n    println!("Hello, World!");\n}',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>',
    css: '/* Welcome to AIForge! */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}',
  };

  return templates[language] || '// Welcome to AIForge!\n';
}