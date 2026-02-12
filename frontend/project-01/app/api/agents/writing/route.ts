import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import { z } from 'zod';

function getGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
}

const requestSchema = z.object({
  input: z.string().min(1),
  format: z.enum(['article', 'report', 'documentation', 'summary']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { input, format } = requestSchema.parse(body);

    const groq = getGroqClient();

    const formatStr = format || 'article';
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a Writing Agent that creates high-quality ${formatStr}s.
Given a topic or request, produce a well-structured ${formatStr} as a JSON object:
- "title": the title of the piece
- "outline": array of section headings
- "content": the full written content in markdown
- "wordCount": approximate word count

Always respond with valid JSON only.`,
        },
        { role: 'user', content: `Write a ${formatStr} about: ${input}` },
      ],
      model: 'llama3-70b-8192',
      temperature: 0.8,
      max_tokens: 4096,
    });

    const raw = completion.choices[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { title: input, outline: [], content: raw, wordCount: raw.split(/\s+/).length };
    }

    // @ts-expect-error Supabase insert type inference
    await supabase.from('agent_tasks').insert({
      user_id: user.id,
      agent_type: 'writing',
      task_type: formatStr,
      input: { input, format: formatStr },
      output: parsed,
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      steps: ['Analyzed topic', 'Created outline', 'Drafted content', 'Polished output'],
      result: parsed.content || raw,
      artifacts: [
        {
          name: parsed.title || `${formatStr} Draft`,
          type: 'text',
          content: parsed.content || raw,
        },
      ],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Writing agent error:', error);
    return NextResponse.json({ error: 'Agent execution failed' }, { status: 500 });
  }
}
