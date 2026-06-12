function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function stringProp(value: unknown, key: string): string | null {
  const record = asRecord(value);
  const prop = record?.[key];
  return typeof prop === 'string' ? prop : null;
}

function backendMessage(error: unknown): string | null {
  if (error instanceof ApiError) return error.message;
  const response = asRecord(error)?.response;
  const data = asRecord(response)?.data;
  const message = asRecord(data)?.message;
  return typeof message === 'string' && message.trim() ? message : null;
}

export function isAuthCancellation(error: unknown): boolean {
  const code = stringProp(error, 'code');
  if (code === 'ERR_REQUEST_CANCELED' || code === 'E_CANCELLED_OPERATION') {
    return true;
  }

  const message =
    error instanceof Error ? error.message : stringProp(error, 'message') ?? String(error);
  const normalized = message.toLowerCase();

  return (
    normalized.includes('cancel') ||
    normalized.includes('cancelled') ||
    normalized.includes('canceled') ||
    normalized.includes('취소')
  );
}

export function getAuthErrorMessage(error: unknown): string {
  const fromBackend = backendMessage(error);
  if (fromBackend) return fromBackend;
  if (error instanceof Error) return error.message;

  const message = stringProp(error, 'message');
  if (message) return message;

  return String(error);
}
import { ApiError } from '@/api/client';
