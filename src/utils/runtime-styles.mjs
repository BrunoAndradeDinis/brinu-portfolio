import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** sonner appends an empty <style> and then fills it with its CSS when the module loads; CSP checks both states. */
function sonnerInjectedCss() {
  const source = readFileSync(require.resolve('sonner'), 'utf8');
  const literal = source.match(/__insertCSS\(("(?:[^"\\]|\\.)*")\)/)?.[1];
  if (!literal) throw new Error('sonner no longer calls __insertCSS: update the CSP style hashes in src/utils/runtime-styles.mjs');
  return JSON.parse(literal);
}

export const RUNTIME_STYLES = ['', sonnerInjectedCss()];
