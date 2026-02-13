import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import { z } from 'zod';

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set. Please configure it to use the Groq client.');
  }
  return new Groq({ apiKey });
}

const requestSchema = z.object({
  input: z.string().min(1),
  url: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { input, url } = requestSchema.parse(body);

    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a Browser Operator Agent that plans web automation tasks.
Given a task description (and optionally a URL), output a JSON object with:
- "plan": array of browser action descriptions
- "result": summary of what would be accomplished
- "extractedData": any data that would be extracted (as text)

Always respond with valid JSON only.`,
        },
        {
          role: 'user',
          content: url
            ? `Task: ${input}\nTarget URL: ${url}`
            : `Task: ${input}`,
        },
      ],
      model: 'llama3-70b-8192',
      temperature: 0.5,
      max_tokens: 4096,
    });

    const raw = completion.choices[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { plan: ['Analyzed target', 'Planned actions'], result: raw, extractedData: '' };
    }

    // @ts-expect-error Supabase insert type inference
    await supabase.from('agent_tasks').insert({
      user_id: user.id,
      agent_type: 'browser',
      task_type: 'automate',
      input: { input, url },
      output: parsed,
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    const artifacts = [];
    if (parsed.extractedData) {
      artifacts.push({
        name: 'Extracted Data',
        type: 'text',
        content: typeof parsed.extractedData === 'string'
          ? parsed.extractedData
          : JSON.stringify(parsed.extractedData, null, 2),
      });
    }

    return NextResponse.json({
      steps: parsed.plan || [],
      result: parsed.result || raw,
      artifacts,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Browser agent error:', error);
    return NextResponse.json({ error: 'Agent execution failed' }, { status: 500 });
  }
}
