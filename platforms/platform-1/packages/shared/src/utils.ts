export function formatDate(date: Date): string {
  return date.toISOString();
}

export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

export function generateId(): string {
  // Use crypto.randomUUID() which is available in Node.js 16+ and modern browsers
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for Node.js environments where global crypto is not available
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { randomUUID } = require('crypto');
    return randomUUID();
  } catch (error) {
    throw new Error(
      'crypto.randomUUID() is not available in this environment. ' +
      'Please use Node.js 16+ or a modern browser, or provide a UUID polyfill.'
    );
  }
}