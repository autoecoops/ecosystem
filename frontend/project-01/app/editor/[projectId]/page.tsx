import { CodeEditor } from '@/components/editor/code-editor';

interface EditorPageProps {
  params: {
    projectId: string;
  };
}

export default function EditorPage({ params }: EditorPageProps) {
  return <CodeEditor projectId={params.projectId} />;
}