import { DICTIONARIES, type Locale } from '../../i18n/dictionaries.ts';
import { PROFILE } from '../../data/profile.ts';
import { getLocalizedCareer, getLocalizedEducation } from '../../data/career.ts';
import { getLocalizedArsenal } from '../../data/arsenal.ts';
import { getLocalizedHobbies, type LocalizedHobby } from '../../data/hobbies.ts';
import { getLocalizedCases } from '../../data/cases.ts';
import { buildResume } from '../../data/resume.ts';
import { sanitizeInput, stripAccents } from './sanitize.ts';
import {
  COMMANDS,
  LOCALE_ARGS,
  RESUME_DOWNLOADS,
  RESUME_FILENAME,
  RESUME_FILES,
  RESUME_URL,
  resolveCommand,
  type CommandName,
  type CommandSpec,
} from './registry.ts';

export type LineTone = 'plain' | 'accent' | 'strong' | 'muted';

export interface TerminalLine {
  readonly text: string;
  readonly tone: LineTone;
  readonly term?: string;
  readonly detail?: string;
}

export type TerminalEffect =
  | { readonly type: 'clear' }
  | { readonly type: 'download'; readonly filename: string; readonly href: string }
  | { readonly type: 'locale'; readonly locale: Locale }
  | { readonly type: 'navigate'; readonly href: string }
  | { readonly type: 'mail'; readonly href: string }
  | { readonly type: 'cilada' };

export interface TerminalResult {
  readonly input: string;
  readonly lines: readonly TerminalLine[];
  readonly effect?: TerminalEffect;
}

const line = (text: string, tone: LineTone = 'plain'): TerminalLine => ({ text, tone });
const lines = (texts: readonly string[], tone: LineTone = 'plain') => texts.map((text) => line(text, tone));

function hobbyKeys(hobby: LocalizedHobby): string[] {
  const name = stripAccents(hobby.name.toLowerCase());
  return [hobby.id, name, name.split(' ')[0]];
}

function findHobby(query: string, locale: Locale): LocalizedHobby | undefined {
  const wanted = stripAccents(query);
  return getLocalizedHobbies(locale).find((hobby) => hobbyKeys(hobby).includes(wanted));
}

type Runner = (args: readonly string[], locale: Locale) => Omit<TerminalResult, 'input'>;

const usage = (spec: CommandSpec, locale: Locale) => ({ lines: [line(`${DICTIONARIES[locale].whoami.usage} ${spec.usage}`, 'muted')] });

const RUNNERS: Record<CommandName, Runner> = {
  help: (_, locale) => {
    const dict = DICTIONARIES[locale].whoami;
    const width = Math.max(...COMMANDS.map((command) => command.usage.length));
    return {
      lines: [
        line(dict.helpHeader, 'accent'),
        ...COMMANDS.map((command) => ({
          ...line(`${command.usage.padEnd(width)}  ${dict.commands[command.name]}`),
          term: command.usage,
          detail: dict.commands[command.name],
        })),
      ],
    };
  },
  clear: () => ({ lines: [], effect: { type: 'clear' } }),
  whoami: (_, locale) => {
    const current = getLocalizedCareer(locale)[0];
    return {
      lines: [
        line(`${PROFILE.fullName} (@${PROFILE.handle})`, 'strong'),
        line(PROFILE.role[locale]),
        line(`${current.role} @ ${current.org}`),
        line(PROFILE.location.remoteLabel[locale], 'muted'),
      ],
    };
  },
  career: (_, locale) => {
    const career = getLocalizedCareer(locale);
    const rank = DICTIONARIES[locale].about.rankLabel;
    return {
      lines: career.flatMap((entry, index) => [
        line(`${rank} ${career.length - index} · ${entry.role} @ ${entry.org}`, 'strong'),
        line(`  ${entry.period}`, 'muted'),
      ]),
    };
  },
  education: (_, locale) => ({
    lines: getLocalizedEducation(locale).flatMap((entry) => [
      line(`${entry.institution.toUpperCase()} · ${entry.course}`, 'strong'),
      line(`  ${entry.period} · ${entry.status}`, 'muted'),
    ]),
  }),
  skills: (_, locale) => ({
    lines: getLocalizedArsenal(locale).flatMap((domain) => [line(domain.title, 'accent'), line(`  ${domain.skills.map((skill) => skill.name).join(' · ')}`)]),
  }),
  hobbies: (args, locale) => {
    const dict = DICTIONARIES[locale].whoami;
    const hobbies = getLocalizedHobbies(locale);
    if (args.length === 0) {
      return {
        lines: [...hobbies.map((hobby) => line(`${hobby.rating} ${hobby.position.code}  ${hobby.name}`)), line(dict.hobbiesHint, 'muted')],
      };
    }
    const hobby = findHobby(args.join(' '), locale);
    if (!hobby) return { lines: [line(`${dict.hobbyOptions} ${hobbies.map((entry) => entry.id).join(', ')}`, 'muted')] };
    return {
      lines: [
        line(`${hobby.rating} ${hobby.position.code} · ${hobby.position.label}`, 'accent'),
        line(hobby.name, 'strong'),
        ...hobby.stats.map((entry) => line(`  ${entry.value} ${entry.code}  ${entry.label}`)),
        line(hobby.text, 'muted'),
      ],
    };
  },
  projects: (_, locale) => ({
    lines: getLocalizedCases(locale).flatMap((project) => [line(project.title, 'strong'), line(`  ${project.subtitle} · /cases/${project.id}`, 'muted')]),
  }),
  ls: () => ({ lines: [line(RESUME_FILES[0])] }),
  cat: (args, locale) => {
    if (args.length !== 1) return usage(resolveCommand('cat') as CommandSpec, locale);
    if (!(RESUME_FILES as readonly string[]).includes(args[0])) return { lines: [line(`cat: ${args[0]}: ${DICTIONARIES[locale].whoami.noFile}`, 'muted')] };
    return { lines: lines(buildResume(locale).split('\n')) };
  },
  download: (args, locale) => {
    if (args.length !== 1 || !(RESUME_DOWNLOADS as readonly string[]).includes(args[0])) return usage(resolveCommand('download') as CommandSpec, locale);
    return {
      lines: [line(`${RESUME_FILENAME} ${DICTIONARIES[locale].whoami.downloaded}`, 'accent')],
      effect: { type: 'download', filename: RESUME_FILENAME, href: RESUME_URL },
    };
  },
  lang: (args, locale) => {
    const next = args.length === 1 ? LOCALE_ARGS[args[0] as keyof typeof LOCALE_ARGS] : undefined;
    if (!next) return usage(resolveCommand('lang') as CommandSpec, locale);
    return { lines: [line(DICTIONARIES[next].whoami.langSet, 'accent')], effect: { type: 'locale', locale: next } };
  },
  contact: (_, locale) => ({
    lines: [line(`${DICTIONARIES[locale].whoami.contactOut} ${PROFILE.email}`, 'accent')],
    effect: { type: 'mail', href: `mailto:${PROFILE.email}` },
  }),
  status: (_, locale) => {
    const current = getLocalizedCareer(locale)[0];
    return {
      lines: [
        line(`${PROFILE.handle.toUpperCase()} // ONLINE`, 'accent'),
        line(PROFILE.family[locale]),
        line(`${current.role} @ ${current.org}`),
        line(PROFILE.location.remoteLabel[locale], 'muted'),
      ],
    };
  },
  cilada: (_, locale) => ({ lines: [line(DICTIONARIES[locale].whoami.ciladaOut, 'accent')], effect: { type: 'cilada' } }),
  exit: (_, locale) => ({ lines: [line(DICTIONARIES[locale].whoami.exitOut, 'muted')], effect: { type: 'navigate', href: '/' } }),
};

const NO_ARGS: readonly CommandName[] = ['help', 'clear', 'whoami', 'career', 'education', 'skills', 'projects', 'ls', 'contact', 'status', 'cilada', 'exit'];

export function runCommand(raw: string, locale: Locale): TerminalResult {
  const input = sanitizeInput(raw);
  if (!input) return { input, lines: [] };
  const [word, ...args] = input.split(' ');
  const spec = resolveCommand(word);
  if (!spec) return { input, lines: [line(`${word}: ${DICTIONARIES[locale].whoami.notFound}`, 'muted')] };
  if (NO_ARGS.includes(spec.name) && args.length > 0) return { input, ...usage(spec, locale) };
  return { input, ...RUNNERS[spec.name](args, locale) };
}

function argumentOptions(name: CommandName, locale: Locale): readonly string[] {
  if (name === 'hobbies') return getLocalizedHobbies(locale).map((hobby) => hobby.id);
  if (name === 'cat') return [RESUME_FILES[0]];
  if (name === 'download') return ['curriculo'];
  if (name === 'lang') return ['pt', 'en'];
  return [];
}

export interface Completion {
  readonly value: string | null;
  readonly options: readonly string[];
}

export function completeInput(raw: string, locale: Locale): Completion {
  const input = sanitizeInput(raw);
  const parts = input.split(' ');
  if (input && /\s$/.test(raw)) parts.push('');
  if (parts.length === 1) {
    const options = COMMANDS.map((command) => command.name).filter((name) => name.startsWith(parts[0]));
    return { value: options.length === 1 ? `${options[0]} ` : null, options };
  }
  const spec = resolveCommand(parts[0]);
  if (!spec || parts.length > 2) return { value: null, options: [] };
  const options = argumentOptions(spec.name, locale).filter((option) => option.startsWith(parts[1]));
  return { value: options.length === 1 ? `${parts[0]} ${options[0]}` : null, options };
}
