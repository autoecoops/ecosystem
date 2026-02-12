'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Upload, Search, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function KnowledgePage() {
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
            <h1 className="text-2xl font-bold">Knowledge Base</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">RAG Knowledge System</h2>
            <p className="text-muted-foreground">
              Upload and search through your documents with AI-powered vector search
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <FeatureCard
              icon={<Upload className="h-6 w-6" />}
              title="Upload Documents"
              description="PDF, DOCX, TXT, MD (up to 50MB)"
            />
            <FeatureCard
              icon={<Database className="h-6 w-6" />}
              title="Vector Storage"
              description="Powered by Supabase pgvector"
            />
            <FeatureCard
              icon={<Search className="h-6 w-6" />}
              title="Semantic Search"
              description="AI-powered similarity search"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>
                Complete RAG system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Document Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatic text extraction, chunking, and vectorization
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Database className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Multiple Knowledge Bases</h3>
                  <p className="text-sm text-muted-foreground">
                    Organize documents into separate knowledge bases
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                The knowledge base interface is under development
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="text-blue-500 mb-2">{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
