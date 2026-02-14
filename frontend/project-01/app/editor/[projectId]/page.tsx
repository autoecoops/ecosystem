import { CodeEditor } from '@/components/editor/code-editor';
import { use } from 'react';

interface EditorPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function EditorPage({ params }: EditorPageProps) {
  const { projectId } = use(params);
  return <CodeEditor projectId={projectId} />;
}
