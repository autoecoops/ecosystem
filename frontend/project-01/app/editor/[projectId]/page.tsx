import { CodeEditor } from '@/components/editor/code-editor';

interface EditorPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId } = await params;
  return <CodeEditor projectId={projectId} />;
}