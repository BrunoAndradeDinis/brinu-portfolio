export const SERVICE_IDS = ['web-system', 'site', 'integration', 'job'] as const;
export const BUDGET_IDS = ['up-to-3k', '3k-8k', '8k-15k', 'over-15k', 'to-discuss'] as const;
export const DEADLINE_IDS = ['urgent', '1-3-months', 'flexible'] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];
export type BudgetId = (typeof BUDGET_IDS)[number];
export type DeadlineId = (typeof DEADLINE_IDS)[number];

export const JOB_SERVICE_ID: ServiceId = 'job';

export const CONTACT_BOUNDS = {
  name: { min: 2, max: 80 },
  company: { max: 80 },
  email: { max: 254 },
  message: { min: 20, max: 2000 },
  phoneDigits: { min: 10, max: 11 },
} as const;

export const CONTACT_DEFAULTS: { readonly budget: BudgetId; readonly deadline: DeadlineId } = {
  budget: 'to-discuss',
  deadline: 'flexible',
};
