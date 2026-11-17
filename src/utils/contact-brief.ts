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
import { digitsOnly, sanitizeLine, sanitizeMultiline } from './contact-sanitize.ts';

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

export function isJobOnly(services: readonly string[]): boolean {
  return services.length === 1 && services[0] === JOB_SERVICE_ID;
}

function pickOption<T extends string>(ids: readonly T[], value: string, fallback: T): T {
  return (ids as readonly string[]).includes(value) ? (value as T) : fallback;
}

function outOfRange(value: string, min: number, max: number): boolean {
  return value.length < min || value.length > max;
}

export function validateContactBrief(raw: RawContactBrief): ContactBriefResult {
  const name = sanitizeLine(raw.name);
  const company = sanitizeLine(raw.company).slice(0, CONTACT_BOUNDS.company.max);
  const email = sanitizeLine(raw.email).toLowerCase();
  const phone = digitsOnly(raw.phone);
  const services = SERVICE_IDS.filter((id) => raw.services.includes(id));
  const message = sanitizeMultiline(raw.message);

  const errors: ContactErrors = {};
  if (outOfRange(name, CONTACT_BOUNDS.name.min, CONTACT_BOUNDS.name.max)) errors.name = 'name-length';
  if (!email) errors.email = 'email-required';
  else if (email.length > CONTACT_BOUNDS.email.max || !EMAIL_PATTERN.test(email)) errors.email = 'email-invalid';
  if (phone && outOfRange(phone, CONTACT_BOUNDS.phoneDigits.min, CONTACT_BOUNDS.phoneDigits.max)) errors.phone = 'phone-invalid';
  if (services.length === 0) errors.services = 'services-required';
  if (outOfRange(message, CONTACT_BOUNDS.message.min, CONTACT_BOUNDS.message.max)) errors.message = 'message-length';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const jobOnly = isJobOnly(services);
  return {
    ok: true,
    brief: {
      name,
      company: company || null,
      email,
      phone: phone || null,
      services,
      budget: jobOnly ? null : pickOption(BUDGET_IDS, raw.budget, CONTACT_DEFAULTS.budget),
      deadline: jobOnly ? null : pickOption(DEADLINE_IDS, raw.deadline, CONTACT_DEFAULTS.deadline),
      message,
    },
  };
}
