'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Search, Globe, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AgentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">AI Agents</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Multi-Agent System</h2>
            <p className="text-muted-foreground">
              Powerful AI agents to automate complex tasks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AgentCard
              icon={<Globe className="h-8 w-8" />}
              title="Browser Agent"
              description="Automate web browsing, form filling, and data extraction with Playwright"
              features={['Navigate websites', 'Fill forms', 'Extract data', 'Take screenshots']}
            />

            <AgentCard
              icon={<Search className="h-8 w-8" />}
              title="Search Agent"
              description="Multi-engine parallel search with deep research capabilities"
              features={['Google search', 'Bing search', 'DuckDuckGo', 'Result synthesis']}
            />

            <AgentCard
              icon={<FileText className="h-8 w-8" />}
              title="Writing Agent"
              description="Generate articles, reports, and presentations with AI"
              features={['Article generation', 'Outline creation', 'Report writing', 'Presentation drafts']}
            />

            <AgentCard
              icon={<Bot className="h-8 w-8" />}
              title="General Agent"
              description="Multi-step task execution with planning and parallelization"
              features={['Task planning', 'Parallel execution', 'Task replay', 'Artifact archiving']}
            />
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                This feature is under active development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The multi-agent system will enable complex automation workflows
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function AgentCard({
  icon,
  title,
  description,
  features,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="text-blue-500">{icon}</div>
          <div>
            <CardTitle>{title}</CardTitle>
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="text-sm flex items-center space-x-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
