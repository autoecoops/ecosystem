'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/stores/project-store';
import { EditorLayout } from './editor-layout';
import { toast } from 'sonner';

interface CodeEditorProps {
  projectId: string;
}

export function CodeEditor({ projectId }: CodeEditorProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const {
    currentProject,
    setCurrentProject,
    setLoading: setProjectLoading,
    isLoading,
  } = useProjectStore();
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
    }
  }, [user, projectId]);

  const fetchProject = async () => {
    setProjectLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const project = await response.json();
        setCurrentProject(project);
      } else if (response.status === 404) {
        toast.error('Project not found');
        router.push('/dashboard');
      } else {
        toast.error('Failed to load project');
      }
    } catch (error) {
      toast.error('Failed to load project');
    } finally {
      setProjectLoading(false);
      setInitLoading(false);
    }
  };

  if (loading || initLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!currentProject && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-500 hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <EditorLayout />;
}