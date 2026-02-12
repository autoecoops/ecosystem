import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import { z } from 'zod';

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  return new Groq({
    apiKey,
  });
}

const chatRequestSchema = z.object({
  message: z.string(),
  context: z.object({
    code: z.string().optional(),
    language: z.string().optional(),
    fileName: z.string().optional(),
  }).optional(),
  type: z.enum(['chat', 'explain', 'refactor', 'debug', 'complete']),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, context, type } = chatRequestSchema.parse(body);

    let systemPrompt = `You are an expert programming assistant integrated into AIForge, an AI-powered code platform. 
You help developers with coding questions, explanations, refactoring, debugging, and code completion.
Always provide clear, concise, and actionable responses.`;

    let userMessage = message;

    switch (type) {
      case 'explain':
        systemPrompt += `\nYour task is to explain the provided code clearly and concisely.`;
        userMessage = `Please explain this ${context?.language || 'code'}:\n\n\`\`\`${context?.language || ''}\n${context?.code}\n\`\`\`\n\n${message}`;
        break;
      case 'refactor':
        systemPrompt += `\nYour task is to suggest improvements and refactoring for the provided code.`;
        userMessage = `Please refactor this ${context?.language || 'code'}:\n\n\`\`\`${context?.language || ''}\n${context?.code}\n\`\`\`\n\n${message}`;
        break;
      case 'debug':
        systemPrompt += `\nYour task is to help debug and fix issues in the provided code.`;
        userMessage = `Help me debug this ${context?.language || 'code'}:\n\n\`\`\`${context?.language || ''}\n${context?.code}\n\`\`\`\n\n${message}`;
        break;
      case 'complete':
        systemPrompt += `\nYour task is to complete the provided code snippet.`;
        userMessage = `Complete this ${context?.language || 'code'}:\n\n\`\`\`${context?.language || ''}\n${context?.code}\n\`\`\`\n\n${message}`;
        break;
    }

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      model: 'llama3-70b-8192',
      temperature: 0.7,
      max_tokens: 2048,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI Chat Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}