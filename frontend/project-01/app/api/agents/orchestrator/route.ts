import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import { z } from 'zod';

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }
  return new Groq({ apiKey });
}

const requestSchema = z.object({
  input: z.string().min(1),
  context: z.object({
    code: z.string().optional(),
    language: z.string().optional(),
    fileName: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { input, context } = requestSchema.parse(body);

    const groq = getGroqClient();

    const planCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a General AI Agent that breaks down complex tasks into steps and executes them.
Given a task, output a JSON object with:
- "plan": array of step descriptions (strings)
- "result": the final answer or output
- "artifacts": array of { "name": string, "type": "code"|"text"|"json", "content": string }

Always respond with valid JSON only.`,
        },
        {
          role: 'user',
          content: context?.code
            ? `Task: ${input}\n\nContext (${context.language || 'code'}, file: ${context.fileName || 'unknown'}):\n\`\`\`\n${context.code}\n\`\`\``
            : `Task: ${input}`,
        },
      ],
      model: 'llama3-70b-8192',
      temperature: 0.7,
      max_tokens: 4096,
    });

    const raw = planCompletion.choices[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { plan: ['Analyzed task', 'Generated response'], result: raw, artifacts: [] };
    }

    // @ts-expect-error Supabase insert type inference
    await supabase.from('agent_tasks').insert({
      user_id: user.id,
      agent_type: 'general',
      task_type: 'orchestrate',
      input: { input, context },
      output: parsed,
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      steps: parsed.plan || [],
      result: parsed.result || raw,
      artifacts: parsed.artifacts || [],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Orchestrator error:', error);
    return NextResponse.json({ error: 'Agent execution failed' }, { status: 500 });
  }
}
