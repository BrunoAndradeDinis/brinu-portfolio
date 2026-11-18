import type { Locale } from '../data/localized.ts';
import type { ContactBrief } from './contact-brief.ts';

export type RelayFailure = 'no-endpoint' | 'network' | 'timeout' | 'http' | 'bad-response' | 'invalid' | 'rate-limited' | 'server-error';

export type RelayResult = { readonly ok: true } | { readonly ok: false; readonly code: RelayFailure };

export interface SendBriefOptions {
  readonly endpoint: string;
  readonly brief: ContactBrief;
  readonly honeypot: string;
  readonly locale: Locale;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
}

export const RELAY_TIMEOUT_MS = 15_000;

const SERVER_FAILURES: ReadonlySet<string> = new Set<RelayFailure>(['invalid', 'rate-limited', 'server-error']);

export async function sendBrief({
  endpoint,
  brief,
  honeypot,
  locale,
  fetchImpl = fetch,
  timeoutMs = RELAY_TIMEOUT_MS,
}: SendBriefOptions): Promise<RelayResult> {
  if (!endpoint) return { ok: false, code: 'no-endpoint' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...brief, website: honeypot, locale }),
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, code: 'http' };
    return readReply(await response.text());
  } catch {
    return { ok: false, code: controller.signal.aborted ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

function readReply(text: string): RelayResult {
  try {
    const reply: unknown = JSON.parse(text);
    if (typeof reply !== 'object' || reply === null) return { ok: false, code: 'bad-response' };
    const { ok, code } = reply as { ok?: unknown; code?: unknown };
    if (ok === true) return { ok: true };
    return { ok: false, code: typeof code === 'string' && SERVER_FAILURES.has(code) ? (code as RelayFailure) : 'bad-response' };
  } catch {
    return { ok: false, code: 'bad-response' };
  }
}
