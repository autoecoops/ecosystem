import { TracingContext, createTrace } from './tracing';
import { EcosystemError, NetworkError } from './errors';
import { AuthClient } from './auth';
import { MemoryClient } from './memory';
import { EventClient } from './events';
import { PolicyClient } from './policy';
import { InfraClient } from './infra';

export interface ClientConfig {
  baseUrl: string;
  token?: string;
  timeout?: number;
  retries?: number;
  retryDelayMs?: number;
}

export interface RequestOptions {
  tracing?: TracingContext;
  timeout?: number;
  retries?: number;
}

export class EcosystemClient {
  private readonly config: Required<ClientConfig>;
  readonly auth: AuthClient;
  readonly memory: MemoryClient;
  readonly events: EventClient;
  readonly policy: PolicyClient;
  readonly infra: InfraClient;

  constructor(config: ClientConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''),
      token: config.token ?? '',
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
    };

    this.auth = new AuthClient(this);
    this.memory = new MemoryClient(this);
    this.events = new EventClient(this);
    this.policy = new PolicyClient(this);
    this.infra = new InfraClient(this);
  }

  setToken(token: string): void {
    this.config.token = token;
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    const tracing = options.tracing ?? createTrace();
    const maxRetries = options.retries ?? this.config.retries;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout ?? this.config.timeout,
      );

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...tracing.toHeaders(),
        };

        if (this.config.token) {
          headers['Authorization'] = `Bearer ${this.config.token}`;
        }

        const response = await fetch(`${this.config.baseUrl}${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          let parsed: { error?: { code?: string; message?: string } } = {};
          try { parsed = JSON.parse(errorBody); } catch { /* noop */ }

          throw new EcosystemError(
            parsed.error?.message ?? `HTTP ${response.status}`,
            parsed.error?.code ?? 'HTTP_ERROR',
            response.status,
            tracing.traceId,
          );
        }

        // Handle 204 No Content and empty responses
        if (response.status === 204 || response.headers.get('content-length') === '0') {
          return undefined as T;
        }

        // Check Content-Type before parsing JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return (await response.json()) as T;
        }

        // For non-JSON responses, return as text or undefined
        const text = await response.text();
        return (text || undefined) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof EcosystemError && error.statusCode < 500) {
          throw error; // Don't retry client errors
        }

        if (attempt < maxRetries) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new NetworkError(
      lastError?.message ?? 'Request failed after retries',
      this.config.baseUrl,
      tracing.traceId,
    );
  }
}
