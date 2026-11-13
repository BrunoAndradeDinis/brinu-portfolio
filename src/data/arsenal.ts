import { t, type Locale, type Localized } from './localized.ts';
import { MAIN_CASES } from './cases.ts';
import { ARCHIVE } from './archive.ts';
import { CAREER } from './career.ts';

export type EvidenceRef = `case:${string}` | `archive:${string}` | `career:${string}`;

export interface ArsenalSkill {
  readonly name: string;
  readonly description: Localized<string>;
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
  skills: { name: string; description: string; evidence: LocalizedEvidence[] }[];
}

export const ARSENAL: readonly ArsenalDomain[] = [
  {
    id: 'frontend',
    title: t('Frontend & Motion', 'Frontend & Motion'),
    skills: [
      { name: 'TypeScript', description: t('Tipagem em todos os meus cases, do site da Magalu Cloud ao AuraStream.', 'Typing across all my cases, from the Magalu Cloud website to AuraStream.'), evidence: ['case:magalu-cloud', 'case:uriana', 'case:efood', 'case:aurastream'] },
      { name: 'React / Next.js', description: t('Interfaces do site da Magalu Cloud, do Uriana e do eFood.', 'Interfaces for the Magalu Cloud website, Uriana and eFood.'), evidence: ['case:magalu-cloud', 'case:uriana', 'case:efood'] },
      { name: 'Astro', description: t('Páginas do site institucional da Magalu Cloud.', 'Pages of the Magalu Cloud corporate website.'), evidence: ['case:magalu-cloud'] },
      { name: 'Tailwind CSS', description: t('Estilos do site da Magalu Cloud e do Uriana.', 'Styling for the Magalu Cloud website and Uriana.'), evidence: ['case:magalu-cloud', 'case:uriana'] },
      { name: 'GSAP', description: t('Transições e animações de scroll deste portfólio.', 'Transitions and scroll animations in this portfolio.'), evidence: ['archive:brinu-portfolio-v2'] },
    ],
  },
  {
    id: 'backend',
    title: t('Backend & Dados', 'Backend & Data'),
    skills: [
      { name: 'Node.js / Express', description: t('API do Quake Log Parser.', 'The Quake Log Parser API.'), evidence: ['archive:quake-log-parser'] },
      { name: 'PostgreSQL + Prisma', description: t('Banco de dados de estoque e vendas do Uriana.', 'Inventory and sales database for Uriana.'), evidence: ['case:uriana'] },
      { name: 'MongoDB', description: t('Persistência dos dados do Quake Log Parser.', 'Data persistence for the Quake Log Parser.'), evidence: ['archive:quake-log-parser'] },
      { name: 'Object Storage', description: t('Armazenamento do AuraStream no Object Storage da Magalu Cloud.', 'AuraStream storage on Magalu Cloud Object Storage.'), evidence: ['case:aurastream'] },
      { name: 'FFmpeg / streaming', description: t('Captura e transmissão de vídeo no AuraStream.', 'Video capture and streaming in AuraStream.'), evidence: ['case:aurastream'] },
    ],
  },
  {
    id: 'quality',
    title: t('Qualidade & Ferramentas', 'Quality & Tooling'),
    skills: [
      { name: 'Jest', description: t('Testes da API do Quake Log Parser.', 'Tests for the Quake Log Parser API.'), evidence: ['archive:quake-log-parser'] },
      { name: 'Playwright', description: t('Testes de ponta a ponta deste portfólio.', 'End-to-end tests for this portfolio.'), evidence: ['archive:brinu-portfolio-v2'] },
      { name: 'Docker Compose', description: t('Ambiente local do Quake Log Parser.', 'Local environment for the Quake Log Parser.'), evidence: ['archive:quake-log-parser'] },
      { name: 'Zod', description: t('Validação de dados no Uriana.', 'Data validation in Uriana.'), evidence: ['case:uriana'] },
      { name: 'Figma / GitLab', description: t('Handoff de design e versionamento no time da Magalu Cloud.', 'Design handoff and version control on the Magalu Cloud team.'), evidence: ['case:magalu-cloud'] },
    ],
  },
];

function evidenceLabel(ref: EvidenceRef, locale: Locale): string | null {
  const [kind, id] = ref.split(':') as ['case' | 'archive' | 'career', string];
  if (kind === 'case') return MAIN_CASES.find((c) => c.id === id)?.text.title[locale] ?? null;
  if (kind === 'archive') return ARCHIVE.find((a) => a.id === id)?.text.title[locale] ?? null;
  return CAREER.find((c) => c.id === id)?.org ?? null;
}

/** The evidence item's own description, shown beside its link; a career entry has none. */
export function getEvidenceDescription(ref: EvidenceRef, locale: Locale): string | null {
  const [kind, id] = ref.split(':') as ['case' | 'archive' | 'career', string];
  if (kind === 'case') return MAIN_CASES.find((c) => c.id === id)?.text.description[locale] ?? null;
  if (kind === 'archive') return ARCHIVE.find((a) => a.id === id)?.text.description[locale] ?? null;
  return null;
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
      description: skill.description[locale],
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
