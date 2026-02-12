import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface File {
  name: string;
  content: string;
  language: string;
  path: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  language: string;
  files: Record<string, string>;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  currentFile: string | null;
  files: Record<string, File>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  setCurrentFile: (fileName: string | null) => void;
  updateFile: (fileName: string, content: string) => void;
  addFile: (file: File) => void;
  deleteFile: (fileName: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProjectStore = create<ProjectState>()(
  subscribeWithSelector((set, get) => ({
    currentProject: null,
    projects: [],
    currentFile: null,
    files: {},
    isLoading: false,
    error: null,

    setCurrentProject: (project) => {
      set({ currentProject: project });
      if (project) {
        const files: Record<string, File> = {};
        Object.entries(project.files || {}).forEach(([path, content]) => {
          const extension = path.split('.').pop() || '';
          const language = getLanguageFromExtension(extension);
          files[path] = {
            name: path.split('/').pop() || path,
            content,
            language,
            path,
          };
        });
        set({ files });
      }
    },

    setProjects: (projects) => set({ projects }),

    setCurrentFile: (fileName) => set({ currentFile: fileName }),

    updateFile: (fileName, content) => {
      const { files, currentProject } = get();
      if (files[fileName] && currentProject) {
        set({
          files: {
            ...files,
            [fileName]: { ...files[fileName], content },
          },
        });
      }
    },

    addFile: (file) => {
      const { files } = get();
      set({
        files: {
          ...files,
          [file.path]: file,
        },
      });
    },

    deleteFile: (fileName) => {
      const { files } = get();
      const newFiles = { ...files };
      delete newFiles[fileName];
      set({ files: newFiles });
    },

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),
  }))
);

function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    jsx: 'javascript',
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