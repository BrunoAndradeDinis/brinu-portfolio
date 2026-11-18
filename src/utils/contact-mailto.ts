import type { BudgetId, DeadlineId, ServiceId } from '../data/contact-brief.ts';
import type { ContactBrief } from './contact-brief.ts';
import { formatBrPhone, sanitizeLine } from './contact-sanitize.ts';

export interface MailtoCopy {
  readonly subjectPrefix: string;
  readonly labels: Readonly<Record<'name' | 'company' | 'email' | 'phone' | 'services' | 'budget' | 'deadline' | 'message', string>>;
  readonly services: Readonly<Record<ServiceId, string>>;
  readonly budgets: Readonly<Record<BudgetId, string>>;
  readonly deadlines: Readonly<Record<DeadlineId, string>>;
}

export function buildMailtoHref(brief: ContactBrief, copy: MailtoCopy, to: string): string {
  const subject = sanitizeLine(`${copy.subjectPrefix} ${brief.name}${brief.company ? ` // ${brief.company}` : ''}`);
  const { labels } = copy;
  const rows: Array<[string, string | null]> = [
    [labels.name, brief.name],
    [labels.company, brief.company],
    [labels.email, brief.email],
    [labels.phone, brief.phone && formatBrPhone(brief.phone)],
    [labels.services, brief.services.map((id) => copy.services[id]).join(', ')],
    [labels.budget, brief.budget && copy.budgets[brief.budget]],
    [labels.deadline, brief.deadline && copy.deadlines[brief.deadline]],
  ];
  const body = [
    ...rows.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`),
    '',
    `${labels.message}:`,
    ...brief.message.split('\n'),
  ].join('\r\n');
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
