import { NextRequest, NextResponse } from 'next/server';
import { chat, type ChatMessage, type ChatOptions } from '@/lib/ai/providers';

export const runtime = 'nodejs';

interface ChatRequestBody {
  messages: ChatMessage[];
  options?: ChatOptions;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required and must not be empty' },
        { status: 400 },
      );
    }

    const response = await chat(body.messages, body.options ?? {});

    return NextResponse.json({ content: response });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
