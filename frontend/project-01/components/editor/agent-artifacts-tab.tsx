'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download,
  Copy,
  Code,
  FileText,
  Image,
  File,
  Braces,
  Package,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useAgentStore } from '@/lib/stores/agent-store';
import type { AgentArtifact } from '@/types/agents';
import { toast } from 'sonner';

const TYPE_ICONS: Record<AgentArtifact['type'], React.ReactNode> = {
  code: <Code className="h-4 w-4 text-emerald-400" />,
  text: <FileText className="h-4 w-4 text-sky-400" />,
  image: <Image className="h-4 w-4 text-amber-400" />,
  file: <File className="h-4 w-4 text-zinc-400" />,
  json: <Braces className="h-4 w-4 text-rose-400" />,
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AgentArtifactsTab() {
  const { currentTask, allArtifacts } = useAgentStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const currentArtifacts = currentTask?.artifacts || [];
  const pastArtifacts = allArtifacts.filter(
    (a) => !currentArtifacts.find((c) => c.id === a.id)
  );

  const allItems = [...currentArtifacts, ...pastArtifacts];

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied');
  };

  const handleDownload = (artifact: AgentArtifact) => {
    const ext = artifact.type === 'json' ? '.json' : artifact.type === 'code' ? '.txt' : '.txt';
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.name + ext;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded');
  };

  if (allItems.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-4">
            <Package className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <h3 className="font-semibold text-sm mb-1 text-muted-foreground">No Artifacts Yet</h3>
          <p className="text-xs text-muted-foreground/70 max-w-[200px] mx-auto">
            Agent outputs like code, reports, and data will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {currentArtifacts.length > 0 && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-2">
            Current Task
          </p>
        )}
        {currentArtifacts.map((a) => (
          <ArtifactRow
            key={a.id}
            artifact={a}
            expanded={expandedId === a.id}
            onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
            onCopy={handleCopy}
            onDownload={handleDownload}
          />
        ))}

        {pastArtifacts.length > 0 && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mt-4 mb-2">
            Previous ({pastArtifacts.length})
          </p>
        )}
        {pastArtifacts.map((a) => (
          <ArtifactRow
            key={a.id}
            artifact={a}
            expanded={expandedId === a.id}
            onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
            onCopy={handleCopy}
            onDownload={handleDownload}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function ArtifactRow({
  artifact,
  expanded,
  onToggle,
  onCopy,
  onDownload,
}: {
  artifact: AgentArtifact;
  expanded: boolean;
  onToggle: () => void;
  onCopy: (c: string) => void;
  onDownload: (a: AgentArtifact) => void;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/40 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        {TYPE_ICONS[artifact.type]}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{artifact.name}</p>
          <p className="text-[10px] text-muted-foreground">{formatSize(artifact.size)}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => { e.stopPropagation(); onCopy(artifact.content); }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => { e.stopPropagation(); onDownload(artifact); }}
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-border bg-muted/20">
          <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap mt-2 max-h-48 overflow-auto">
            {artifact.content.slice(0, 2000)}
            {artifact.content.length > 2000 && '\n... truncated'}
          </pre>
        </div>
      )}
    </div>
  );
}
