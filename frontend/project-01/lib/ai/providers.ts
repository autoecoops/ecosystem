import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

let groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export const AI_MODELS = {
  anthropic: {
    default: 'claude-3-5-sonnet-20241022',
    fast: 'claude-3-5-haiku-20241022',
  },
  groq: {
    default: 'llama-3.3-70b-versatile',
    fast: 'llama-3.1-8b-instant',
  },
} as const;

export type AIProvider = 'anthropic' | 'groq';
export type AIModelSpeed = 'default' | 'fast';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  provider?: AIProvider;
  speed?: AIModelSpeed;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export async function chat(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const {
    provider = 'anthropic',
    speed = 'default',
    maxTokens = 4096,
    temperature = 0.7,
    systemPrompt,
  } = options;

  try {
    if (provider === 'anthropic') {
      return await chatWithAnthropic(messages, {
        model: AI_MODELS.anthropic[speed],
        maxTokens,
        temperature,
        systemPrompt,
      });
    }
    return await chatWithGroq(messages, {
      model: AI_MODELS.groq[speed],
      maxTokens,
      temperature,
      systemPrompt,
    });
  } catch (error) {
    if (provider === 'anthropic') {
      console.warn('Anthropic failed, falling back to Groq:', error);
      return chatWithGroq(messages, {
        model: AI_MODELS.groq[speed],
        maxTokens,
        temperature,
        systemPrompt,
      });
    }
    throw error;
  }
}

async function chatWithAnthropic(
  messages: ChatMessage[],
  opts: { model: string; maxTokens: number; temperature: number; systemPrompt?: string },
): Promise<string> {
  const client = getAnthropicClient();
  const anthropicMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const response = await client.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature,
    system: opts.systemPrompt ?? messages.find((m) => m.role === 'system')?.content,
    messages: anthropicMessages,
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock?.text ?? '';
}

async function chatWithGroq(
  messages: ChatMessage[],
  opts: { model: string; maxTokens: number; temperature: number; systemPrompt?: string },
): Promise<string> {
  const client = getGroqClient();
  const groqMessages = opts.systemPrompt
    ? [{ role: 'system' as const, content: opts.systemPrompt }, ...messages]
    : messages;

  const response = await client.chat.completions.create({
    model: opts.model,
    messages: groqMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: opts.maxTokens,
    temperature: opts.temperature,
  });

  return response.choices[0]?.message?.content ?? '';
}
