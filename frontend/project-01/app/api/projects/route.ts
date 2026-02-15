import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const DEFAULT_MAIN_JS_CONTENT =
  '// Welcome to machops!\nconsole.log("Hello, World!");';

const DEFAULT_MAIN_TS_CONTENT =
  '// Welcome to machops!\nconsole.log("Hello, World!");';

const DEFAULT_MAIN_PY_CONTENT =
  '# Welcome to machops!\nprint("Hello, World!")';

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  language: z.string(),
});

function getDefaultFileName(language: string | undefined): string {
  switch (language?.toLowerCase()) {
    case 'javascript':
    case 'js':
      return 'main.js';
    case 'typescript':
    case 'ts':
      return 'main.ts';
    case 'python':
    case 'py':
      return 'main.py';
    default:
      return 'main.js';
  }
}

function getDefaultFileContent(language: string | undefined): string {
  switch (language?.toLowerCase()) {
    case 'javascript':
    case 'js':
      return DEFAULT_MAIN_JS_CONTENT;
    case 'typescript':
    case 'ts':
      return DEFAULT_MAIN_TS_CONTENT;
    case 'python':
    case 'py':
      return DEFAULT_MAIN_PY_CONTENT;
    default:
      return DEFAULT_MAIN_JS_CONTENT;
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(projects);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching projects:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error('Error fetching projects:', String(error));
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);
    const defaultFileName = getDefaultFileName(validatedData.language);
    const defaultFileContent = getDefaultFileContent(validatedData.language);

    const { data: project, error } = await supabase
      .from('projects')
      .insert([
        {
          ...validatedData,
          user_id: user.id,
          files: {
            [defaultFileName]: defaultFileContent
          }
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}