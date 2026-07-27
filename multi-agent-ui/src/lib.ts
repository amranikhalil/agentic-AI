import type { SearchResult } from './types';

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function faviconUrl(url: string): string {
  const d = domainOf(url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=16`;
}

export { type SearchResult };