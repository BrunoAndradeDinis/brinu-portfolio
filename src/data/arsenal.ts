import { t, type Locale, type Localized } from './localized.ts';
import { MAIN_CASES } from './cases.ts';
import { ARCHIVE } from './archive.ts';
import { CAREER } from './career.ts';

export type EvidenceRef = `case:${string}` | `archive:${string}` | `career:${string}`;

export interface ArsenalSkill {
  readonly name: string;
  readonly evidence: readonly EvidenceRef[];
}

export interface ArsenalDomain {
  readonly id: 'frontend' | 'backend' | 'quality';
  readonly title: Localized<string>;
  readonly skills: readonly ArsenalSkill[];
}

export interface LocalizedEvidence {
  ref: EvidenceRef;
  anchor: string;
  label: string;
}

export interface LocalizedArsenalDomain {
  id: ArsenalDomain['id'];
  title: string;
  skills: { name: string; evidence: LocalizedEvidence[] }[];
}

export const ARSENAL: readonly ArsenalDomain[] = [
  {
    id: 'frontend',
    title: t('Frontend & Motion', 'Frontend & Motion'),
    skills: [
      { name: 'TypeScript', evidence: ['case:magalu-cloud', 'case:uriana', 'case:efood', 'case:aurastream'] },
      { name: 'React / Next.js', evidence: ['case:magalu-cloud', 'case:uriana', 'case:efood'] },
      { name: 'Astro', evidence: ['case:magalu-cloud'] },
      { name: 'Tailwind CSS', evidence: ['case:magalu-cloud', 'case:uriana'] },
      { name: 'GSAP', evidence: ['archive:brinu-portfolio-v2'] },
    ],
  },
  {
    id: 'backend',
    title: t('Backend & Dados', 'Backend & Data'),
    skills: [
      { name: 'Node.js / Express', evidence: ['archive:quake-log-parser'] },
      { name: 'PostgreSQL + Prisma', evidence: ['case:uriana'] },
      { name: 'MongoDB', evidence: ['archive:quake-log-parser'] },
      { name: 'Object Storage', evidence: ['case:aurastream'] },
      { name: 'FFmpeg / streaming', evidence: ['case:aurastream'] },
    ],
  },
  {
    id: 'quality',
    title: t('Qualidade & Ferramentas', 'Quality & Tooling'),
    skills: [
      { name: 'Jest', evidence: ['archive:quake-log-parser'] },
      { name: 'Playwright', evidence: ['archive:brinu-portfolio-v2'] },
      { name: 'Docker Compose', evidence: ['archive:quake-log-parser'] },
      { name: 'Zod', evidence: ['case:uriana'] },
      { name: 'Figma / GitLab', evidence: ['case:magalu-cloud'] },
    ],
  },
];

function evidenceLabel(ref: EvidenceRef, locale: Locale): string | null {
  const [kind, id] = ref.split(':') as ['case' | 'archive' | 'career', string];
  if (kind === 'case') return MAIN_CASES.find((c) => c.id === id)?.text.title[locale] ?? null;
  if (kind === 'archive') return ARCHIVE.find((a) => a.id === id)?.text.title[locale] ?? null;
  return CAREER.find((c) => c.id === id)?.org ?? null;
}

export function resolveEvidenceAnchor(ref: string): string | null {
  const match = /^(case|archive|career):(.+)$/.exec(ref);
  if (!match) return null;
  const [, kind, id] = match;
  return evidenceLabel(ref as EvidenceRef, 'pt-br') === null ? null : `${kind}-${id}`;
}

export function getLocalizedArsenal(locale: Locale): LocalizedArsenalDomain[] {
  return ARSENAL.map((domain) => ({
    id: domain.id,
    title: domain.title[locale],
    skills: domain.skills.map((skill) => ({
      name: skill.name,
      evidence: skill.evidence.map((ref) => ({
        ref,
        anchor: resolveEvidenceAnchor(ref) ?? '',
        label: evidenceLabel(ref, locale) ?? '',
      })),
    })),
  }));
}

const COUNTER_WORDS = {
  domains: t('DOMÍNIOS', 'DOMAINS'),
  skills: t('SKILLS COM PROVA', 'SKILLS WITH PROOF'),
};

export function getArsenalCounter(locale: Locale): string {
  const skills = ARSENAL.reduce((total, domain) => total + domain.skills.length, 0);
  return `${ARSENAL.length} ${COUNTER_WORDS.domains[locale]} • ${skills} ${COUNTER_WORDS.skills[locale]}`;
}
