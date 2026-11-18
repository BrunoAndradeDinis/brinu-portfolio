import { getLocale } from '../i18n/index';
import { getLocalizedCases } from '../data/cases';
import { CONSOLE_COMMANDS } from './terminal/registry';
import { buildReceipt } from './receipt';

const BOX = ['display: inline-block', 'font-family: monospace', 'line-height: 1.45', 'white-space: pre'];
const HEADER_STYLE = [...BOX, 'color: #FBFAF4', 'background: #FE0000', 'font-size: 13px', 'font-weight: bold', 'padding: 8px 12px', 'border: 2px solid #FBFAF4'].join(';');
const RECEIPT_STYLE = [...BOX, 'color: #FBFAF4', 'background: #080808', 'font-size: 11px', 'padding: 12px 14px', 'border: 2px solid #FE0000'].join(';');

export function printBebopReceipt(): void {
  if (typeof console === 'undefined') return;
  const receipt = buildReceipt(getLocale());
  console.log(`%c${receipt.header}`, HEADER_STYLE);
  console.log(`%c${receipt.body}`, RECEIPT_STYLE);
}

async function runConsoleCommand(name: (typeof CONSOLE_COMMANDS)[number]['name']): Promise<void> {
  const locale = getLocale();
  if (name === 'status') printBebopReceipt();
  if (name === 'projects') {
    console.table(getLocalizedCases(locale).map((project) => ({ Case: project.title, Stack: project.stack.join(' · '), URL: `/cases/${project.id}` })));
    return;
  }
  const { runCommand } = await import('./terminal/commands');
  const result = runCommand(name, locale);
  console.log(result.lines.map((line) => line.text).join('\n'));
  if (result.effect?.type === 'mail') window.location.href = result.effect.href;
  if (result.effect?.type === 'cilada') window.dispatchEvent(new CustomEvent('bebop:cilada-trigger'));
}

export function initTelemetry(): void {
  if (typeof window === 'undefined') return;

  printBebopReceipt();

  try {
    for (const command of CONSOLE_COMMANDS) {
      Object.defineProperty(window, command.name, {
        get: () => {
          void runConsoleCommand(command.name);
          return `[${command.name.toUpperCase()}] /whoami`;
        },
        configurable: true,
      });
    }
  } catch (err) {
    console.warn('[Telemetry] Falha ao registrar assessores globais:', err);
  }
}
