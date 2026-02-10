import { randomUUID } from 'crypto';

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Generates a cryptographically secure UUID.
 * 
 * Note: This function uses Node.js crypto.randomUUID() and requires Node.js 16+.
 * For browser environments, consider using the Web Crypto API or a cross-platform UUID library.
 */
export function generateId(): string {
  return randomUUID();
}