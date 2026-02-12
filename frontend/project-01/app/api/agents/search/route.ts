import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import { z } from 'zod';

function getGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
}

const requestSchema = z.object({
  input: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { input } = requestSchema.parse(body);

    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a Search Agent that performs deep research on topics.
Given a query, provide a comprehensive research report as a JSON object:
- "summary": a brief summary of findings
- "sources": array of { "title": string, "snippet": string }
- "keyFindings": array of strings
- "result": the full synthesized answer

Always respond with valid JSON only.`,
        },
        { role: 'user', content: `Research query: ${input}` },
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
      parsed = { summary: raw, sources: [], keyFindings: [], result: raw };
    }

    // @ts-expect-error Supabase insert type inference
    await supabase.from('agent_tasks').insert({
      user_id: user.id,
      agent_type: 'search',
      task_type: 'research',
      input: { input },
      output: parsed,
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      steps: ['Parsed query', 'Searched knowledge base', 'Synthesized results'],
      result: parsed.result || parsed.summary || raw,
      artifacts: [
        {
          name: 'Research Report',
          type: 'text',
          content: JSON.stringify(parsed, null, 2),
        },
      ],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Search agent error:', error);
    return NextResponse.json({ error: 'Agent execution failed' }, { status: 500 });
  }
}
