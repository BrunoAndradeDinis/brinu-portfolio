export type CommandName =
  | 'help'
  | 'clear'
  | 'whoami'
  | 'career'
  | 'education'
  | 'skills'
  | 'hobbies'
  | 'projects'
  | 'ls'
  | 'cat'
  | 'download'
  | 'lang'
  | 'contact'
  | 'status'
  | 'cilada'
  | 'exit';

export interface CommandSpec {
  readonly name: CommandName;
  readonly aliases: readonly string[];
  readonly usage: string;
  readonly console?: true;
}

export const COMMANDS: readonly CommandSpec[] = [
  { name: 'help', aliases: ['ajuda', '?'], usage: 'help' },
  { name: 'clear', aliases: ['limpar', 'cls'], usage: 'clear' },
  { name: 'whoami', aliases: ['quemsou'], usage: 'whoami', console: true },
  { name: 'career', aliases: ['trajetoria'], usage: 'career' },
  { name: 'education', aliases: ['formacao'], usage: 'education' },
  { name: 'skills', aliases: ['habilidades', 'arsenal'], usage: 'skills' },
  { name: 'hobbies', aliases: [], usage: 'hobbies [nome]' },
  { name: 'projects', aliases: ['projetos'], usage: 'projects', console: true },
  { name: 'ls', aliases: [], usage: 'ls' },
  { name: 'cat', aliases: [], usage: 'cat curriculo.txt' },
  { name: 'download', aliases: ['baixar'], usage: 'download curriculo' },
  { name: 'lang', aliases: ['idioma'], usage: 'lang pt | lang en' },
  { name: 'contact', aliases: ['contato'], usage: 'contact', console: true },
  { name: 'status', aliases: [], usage: 'status', console: true },
  { name: 'cilada', aliases: [], usage: 'cilada', console: true },
  { name: 'exit', aliases: ['sair'], usage: 'exit' },
];

export const CONSOLE_COMMANDS: readonly CommandSpec[] = COMMANDS.filter((command) => command.console);

export function resolveCommand(word: string): CommandSpec | undefined {
  return COMMANDS.find((command) => command.name === word || command.aliases.includes(word));
}

export const RESUME_FILES = ['curriculo.txt', 'resume.txt'] as const;
export const RESUME_DOWNLOADS = ['curriculo', 'resume', 'curriculo.pdf', 'resume.pdf'] as const;
export const RESUME_FILENAME = 'curriculo-bruno-dinis.pdf';
export const RESUME_URL = `/${RESUME_FILENAME}`;
export const LOCALE_ARGS = { pt: 'pt-br', 'pt-br': 'pt-br', en: 'en' } as const;
