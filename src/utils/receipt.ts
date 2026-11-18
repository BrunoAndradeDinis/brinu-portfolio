import { PROFILE } from '../data/profile.ts';
import { getLocalizedCareer } from '../data/career.ts';
import { getLocalizedCases } from '../data/cases.ts';
import { DICTIONARIES, type Locale } from '../i18n/dictionaries.ts';
import { CONSOLE_COMMANDS } from './terminal/registry.ts';

const WIDTH = 64;
const DOUBLE = '='.repeat(WIDTH);
const SINGLE = '-'.repeat(WIDTH);

const field = (label: string, value: string) => `${`${label}:`.padEnd(10)}${value}`;
const item = (index: number, description: string, value: string) =>
  `${String(index).padStart(2, '0')}    ${description.padEnd(36)}[${value}]`;

export interface ConsoleReceipt {
  readonly header: string;
  readonly body: string;
}

export function buildReceipt(locale: Locale): ConsoleReceipt {
  const dict = DICTIONARIES[locale];
  const labels = dict.receipt;
  const current = getLocalizedCareer(locale)[0];
  const items: Array<[string, string]> = [
    ['GitHub', `OK - ${PROFILE.github.handle}`],
    ['LinkedIn', `OK - ${PROFILE.linkedin.handle}`],
    ...getLocalizedCases(locale).map((project): [string, string] => [project.title, project.status.toUpperCase()]),
  ];
  const commandWidth = Math.max(...CONSOLE_COMMANDS.map((command) => command.name.length), '/whoami'.length);
  const body = [
    DOUBLE,
    labels.title,
    SINGLE,
    field(labels.operator, `${PROFILE.fullName} ("${PROFILE.handle}")`),
    field(labels.status, `${PROFILE.role[locale]} @ ${current.org}`),
    field(labels.base, PROFILE.location.remoteLabel[locale]),
    field(labels.email, PROFILE.email),
    field(labels.linkedin, PROFILE.linkedin.handle),
    SINGLE,
    `${labels.item.padEnd(6)}${labels.description.padEnd(36)}${labels.value}`,
    ...items.map(([description, value], index) => item(index + 1, description, value)),
    SINGLE,
    field(labels.total, PROFILE.tagline[locale]),
    DOUBLE,
    `${labels.commands}:`,
    ...CONSOLE_COMMANDS.map((command) => `  > ${command.name.padEnd(commandWidth)}  -> ${dict.whoami.commands[command.name]}`),
    `  > ${'/whoami'.padEnd(commandWidth)}  -> ${labels.terminal}`,
    DOUBLE,
  ].join('\n');
  return { header: labels.header, body };
}
