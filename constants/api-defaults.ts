/** Production La Romana API (Next.js app). */
export const LA_ROMANA_DEFAULT_API_URL = 'https://la-romana-hotel.vercel.app';

/** Human-readable backend name shown in UI copy. */
export const BACKEND_NAME = 'La Romana';

/** Normalize staff-entered API URLs (trailing slash, missing scheme). */
export function normalizeApiBaseUrl(baseUrl: string): string {
  let normalized = baseUrl.trim().replace(/\/$/, '');
  if (normalized && !/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  return normalized;
}
