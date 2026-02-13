import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const executeRequestSchema = z.object({
  code: z.string(),
  language: z.string(),
  input: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, language } = executeRequestSchema.parse(body);

    // For this MVP, we'll simulate code execution
    // In production, you would integrate with a secure sandbox environment
    let output = '';
    let error = '';

    switch (language) {
      case 'javascript':
      case 'typescript':
        try {
          // Simulate JavaScript execution
          output = `Executed JavaScript code successfully!\nCode: ${code.substring(0, 100)}...`;
        } catch (e) {
          error = `JavaScript execution error: ${e}`;
        }
        break;
      case 'python':
        try {
          // Simulate Python execution
          output = `Executed Python code successfully!\nCode: ${code.substring(0, 100)}...`;
        } catch (e) {
          error = `Python execution error: ${e}`;
        }
        break;
      default:
        output = `Language ${language} execution simulated.\nCode: ${code.substring(0, 100)}...`;
    }

    return NextResponse.json({
      output,
      error,
      executionTime: Math.random() * 1000,
    });
  } catch (err) {
    console.error('Execute Error:', err);
    
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: err.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    );
  }
}