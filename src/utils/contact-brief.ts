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
  'name-length' | 'email-required' | 'email-invalid' | 'phone-invalid' | 'services-required' | 'message-length';

export type ContactErrors = Partial<Record<ContactField, ContactErrorCode>>;

export type ContactBriefResult =
  { readonly ok: true; readonly brief: ContactBrief } | { readonly ok: false; readonly errors: ContactErrors };

const EMAIL_PATTERN =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
const { name, company, email, message, phoneDigits } = CONTACT_BOUNDS;

const FIELD_FALLBACK_CODE: Readonly<Record<ContactField, ContactErrorCode>> = {
  name: 'name-length',
  email: 'email-invalid',
  phone: 'phone-invalid',
  services: 'services-required',
  message: 'message-length',
};

const ERROR_CODES = new Set<string>(Object.values(FIELD_FALLBACK_CODE).concat('email-required'));

export function isJobOnly(services: readonly string[]): boolean {
  return services.length === 1 && services[0] === JOB_SERVICE_ID;
}

const text = () => z.unknown().transform((value) => (typeof value === 'string' ? value : ''));

const optionOrDefault = <T extends string>(ids: readonly T[], fallback: T) =>
  z.unknown().transform((value): T => (typeof value === 'string' && (ids as readonly string[]).includes(value) ? (value as T) : fallback));

const EMPTY_RAW: RawContactBrief = {
  name: '',
  company: '',
  email: '',
  phone: '',
  services: [],
  budget: '',
  deadline: '',
  message: '',
};

const withEmptyDefaults = (value: unknown): unknown =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? { ...EMPTY_RAW, ...value } : EMPTY_RAW;

export const contactBriefSchema = z.preprocess(
  withEmptyDefaults,
  z
    .object({
      name: text().transform(sanitizeLine).pipe(z.string().min(name.min, 'name-length').max(name.max, 'name-length')),
      company: text().transform((value) => truncate(sanitizeLine(value), company.max) || null),
      email: text()
        .transform((value) => sanitizeLine(value).toLowerCase())
        .pipe(z.string().min(1, 'email-required').max(email.max, 'email-invalid').regex(EMAIL_PATTERN, 'email-invalid')),
      phone: text()
        .transform(toPhoneDigits)
        .refine((digits) => !digits || (digits.length >= phoneDigits.min && digits.length <= phoneDigits.max), 'phone-invalid')
        .transform((digits) => digits || null),
      services: z
        .unknown()
        .transform((list) => (Array.isArray(list) ? SERVICE_IDS.filter((id) => list.includes(id)) : []))
        .pipe(z.array(z.enum(SERVICE_IDS)).min(1, 'services-required')),
      budget: optionOrDefault(BUDGET_IDS, CONTACT_DEFAULTS.budget),
      deadline: optionOrDefault(DEADLINE_IDS, CONTACT_DEFAULTS.deadline),
      message: text().transform(sanitizeMultiline).pipe(z.string().min(message.min, 'message-length').max(message.max, 'message-length')),
    })
    .transform((brief): ContactBrief => (isJobOnly(brief.services) ? { ...brief, budget: null, deadline: null } : brief)),
);

export function validateContactBrief(raw: RawContactBrief | Record<string, unknown>): ContactBriefResult {
  const parsed = contactBriefSchema.safeParse(raw);
  if (parsed.success) return { ok: true, brief: parsed.data };

  const errors: ContactErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (typeof field !== 'string' || !(field in FIELD_FALLBACK_CODE)) continue;
    const key = field as ContactField;
    errors[key] ??= ERROR_CODES.has(issue.message) ? (issue.message as ContactErrorCode) : FIELD_FALLBACK_CODE[key];
  }
  return { ok: false, errors };
}
