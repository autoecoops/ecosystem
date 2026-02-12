import { NextResponse } from 'next/server';

export async function GET() {
  const models = {
    groq: ['llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'],
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
  };
  return NextResponse.json(models);
}
