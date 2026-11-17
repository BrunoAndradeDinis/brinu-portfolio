import { z } from 'zod';
import {
  BUDGET_IDS,
  CONTACT_BOUNDS,
  CONTACT_DEFAULTS,
  DEADLINE_IDS,
  JOB_SERVICE_ID,
  SERVICE_IDS,
  type BudgetId,
  type DeadlineId,
  type ServiceId,
} from '../data/contact-brief.ts';
import { phoneDigits as toPhoneDigits, sanitizeLine, sanitizeMultiline, truncate } from './contact-sanitize.ts';

export interface RawContactBrief {
  readonly name: string;
  readonly company: string;
  readonly email: string;
  readonly phone: string;
  readonly services: readonly string[];
  readonly budget: string;
  readonly deadline: string;
  readonly message: string;
}

export interface ContactBrief {
  readonly name: string;
  readonly company: string | null;
  readonly email: string;
  readonly phone: string | null;
  readonly services: readonly ServiceId[];
  readonly budget: BudgetId | null;
  readonly deadline: DeadlineId | null;
  readonly message: string;
}

export type ContactField = 'name' | 'email' | 'phone' | 'services' | 'message';

export type ContactErrorCode =
  | 'name-length'
  | 'email-required'
  | 'email-invalid'
  | 'phone-invalid'
  | 'services-required'
  | 'message-length';

export type ContactErrors = Partial<Record<ContactField, ContactErrorCode>>;

export type ContactBriefResult =
  | { readonly ok: true; readonly brief: ContactBrief }
  | { readonly ok: false; readonly errors: ContactErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { name, company, email, message, phoneDigits } = CONTACT_BOUNDS;

export function isJobOnly(services: readonly string[]): boolean {
  return services.length === 1 && services[0] === JOB_SERVICE_ID;
}

const optionOrDefault = <T extends string>(ids: readonly T[], fallback: T) =>
  z.string().transform((value): T => ((ids as readonly string[]).includes(value) ? (value as T) : fallback));

export const contactBriefSchema = z
  .object({
    name: z
      .string()
      .transform(sanitizeLine)
      .pipe(z.string().min(name.min, 'name-length').max(name.max, 'name-length')),
    company: z
      .string()
      .transform((value) => truncate(sanitizeLine(value), company.max) || null),
    email: z
      .string()
      .transform((value) => sanitizeLine(value).toLowerCase())
      .pipe(z.string().min(1, 'email-required').max(email.max, 'email-invalid').regex(EMAIL_PATTERN, 'email-invalid')),
    phone: z
      .string()
      .transform(toPhoneDigits)
      .refine((digits) => !digits || (digits.length >= phoneDigits.min && digits.length <= phoneDigits.max), 'phone-invalid')
      .transform((digits) => digits || null),
    services: z
      .array(z.string())
      .transform((list) => SERVICE_IDS.filter((id) => list.includes(id)))
      .pipe(z.array(z.enum(SERVICE_IDS)).min(1, 'services-required')),
    budget: optionOrDefault(BUDGET_IDS, CONTACT_DEFAULTS.budget),
    deadline: optionOrDefault(DEADLINE_IDS, CONTACT_DEFAULTS.deadline),
    message: z
      .string()
      .transform(sanitizeMultiline)
      .pipe(z.string().min(message.min, 'message-length').max(message.max, 'message-length')),
  })
  .transform(
    (brief): ContactBrief =>
      isJobOnly(brief.services) ? { ...brief, budget: null, deadline: null } : brief
  );

export function validateContactBrief(raw: RawContactBrief): ContactBriefResult {
  const parsed = contactBriefSchema.safeParse(raw);
  if (parsed.success) return { ok: true, brief: parsed.data };

  const errors: ContactErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as ContactField;
    errors[field] ??= issue.message as ContactErrorCode;
  }
  return { ok: false, errors };
}
