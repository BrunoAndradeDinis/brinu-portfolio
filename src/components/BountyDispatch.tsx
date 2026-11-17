import React, { useMemo, useState } from 'react';
import { audioSynth } from '../utils/audio';
import { useLocale } from '../i18n/index';
import { PROFILE } from '../data/profile';
import { BUDGET_IDS, CONTACT_BOUNDS, CONTACT_DEFAULTS, DEADLINE_IDS, SERVICE_IDS } from '../data/contact-brief';
import { isJobOnly, validateContactBrief, type ContactBrief, type ContactField, type RawContactBrief } from '../utils/contact-brief';
import { formatBrPhone } from '../utils/contact-sanitize';
import { ChoiceGroup, TextField } from './contact/fields';
import { DispatchReceipt } from './contact/DispatchReceipt';

type FormValues = { -readonly [K in keyof RawContactBrief]: RawContactBrief[K] };
type Touched = Partial<Record<ContactField, true>>;

const INITIAL_VALUES: FormValues = {
  name: '',
  company: '',
  email: '',
  phone: '',
  services: [],
  budget: CONTACT_DEFAULTS.budget,
  deadline: CONTACT_DEFAULTS.deadline,
  message: '',
};

const ALL_TOUCHED: Touched = { name: true, email: true, phone: true, services: true, message: true };

const FIELD_ORDER: readonly ContactField[] = ['name', 'email', 'phone', 'services', 'message'];
const SUBMIT_HINT_ID = 'dispatch-submit-hint';

const PHONE_PASTE_LENGTH = 25;

export const BountyDispatch: React.FC = () => {
  const { dict: t } = useLocale();
  const copy = t.dispatch;
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [touched, setTouched] = useState<Touched>({});
  const [brief, setBrief] = useState<ContactBrief | null>(null);
  const [dispatchTime, setDispatchTime] = useState<string>('');

  const validation = useMemo(() => validateContactBrief(values), [values]);
  const liveErrors = validation.ok ? {} : validation.errors;
  const missingFields = FIELD_ORDER.filter((field) => liveErrors[field]).map((field) => copy.mail[field]);

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const touch = (field: ContactField) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const toggleService = (id: string) => {
    const next = values.services.includes(id) ? values.services.filter((s) => s !== id) : [...values.services, id];
    update('services', next);
    touch('services');
  };

  const errorText = (field: ContactField): string | undefined => {
    const code = liveErrors[field];
    return touched[field] && code ? copy.errors[code] : undefined;
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validation.ok) {
      setTouched(ALL_TOUCHED);
      return;
    }

    setBrief(validation.brief);
    setDispatchTime(new Date().toUTCString());
    if (!audioSynth.isMuted()) audioSynth.playBountyAcquired();
  };

  const handleReset = () => {
    setValues(INITIAL_VALUES);
    setTouched({});
    setBrief(null);
  };

  const showBudgetAndDeadline = !isJobOnly(values.services);

  return (
    <div
      data-bounty-dispatch
      className="border-4 border-space-base bg-space-base p-6 sm:p-8 font-mono shadow-[8px_8px_0_var(--color-bebop-red)] text-paper-white relative overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 pb-4 mb-6 border-b-2 border-bebop-red">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-3 h-3 shrink-0 bg-bebop-red" />
          <span className="font-bold text-xs uppercase tracking-widest text-bebop-red">{copy.headerTitle}</span>
        </div>

        <span className="text-[10px] sm:text-xs text-muted-gray uppercase text-right">{copy.headerSub}</span>
      </div>

      {!brief ? (
        <form onSubmit={handleSubmit} noValidate className="space-y-5" data-dispatch-form>
          <TextField
            id="dispatch-name"
            field="name"
            label={copy.nameLabel}
            value={values.name}
            onChange={(value) => update('name', value)}
            placeholder={copy.namePlaceholder}
            maxLength={CONTACT_BOUNDS.name.max}
            autoComplete="name"
            onBlur={() => touch('name')}
            error={errorText('name')}
          />
          <TextField
            id="dispatch-company"
            field="company"
            label={copy.companyLabel}
            optionalTag={copy.optionalTag}
            value={values.company}
            onChange={(value) => update('company', value)}
            placeholder={copy.companyPlaceholder}
            maxLength={CONTACT_BOUNDS.company.max}
            autoComplete="organization"
          />
          <TextField
            id="dispatch-email"
            field="email"
            type="email"
            inputMode="email"
            label={copy.emailLabel}
            value={values.email}
            onChange={(value) => update('email', value)}
            placeholder={copy.emailPlaceholder}
            maxLength={CONTACT_BOUNDS.email.max}
            autoComplete="email"
            onBlur={() => touch('email')}
            error={errorText('email')}
          />
          <TextField
            id="dispatch-phone"
            field="phone"
            type="tel"
            inputMode="tel"
            label={copy.phoneLabel}
            optionalTag={copy.optionalTag}
            value={values.phone}
            onChange={(value) => update('phone', formatBrPhone(value))}
            placeholder={copy.phonePlaceholder}
            maxLength={PHONE_PASTE_LENGTH}
            autoComplete="tel-national"
            onBlur={() => touch('phone')}
            error={errorText('phone')}
          />
          <ChoiceGroup
            id="dispatch-services"
            field="services"
            type="checkbox"
            legend={copy.servicesLegend}
            options={SERVICE_IDS.map((id) => ({ value: id, label: copy.services[id] }))}
            selected={values.services}
            onSelect={toggleService}
            onLeave={() => touch('services')}
            error={errorText('services')}
          />
          {showBudgetAndDeadline && (
            <>
              <ChoiceGroup
                id="dispatch-budget"
                field="budget"
                type="radio"
                legend={copy.budgetLegend}
                options={BUDGET_IDS.map((id) => ({ value: id, label: copy.budgets[id] }))}
                selected={[values.budget]}
                onSelect={(value) => update('budget', value)}
              />
              <ChoiceGroup
                id="dispatch-deadline"
                field="deadline"
                type="radio"
                legend={copy.deadlineLegend}
                options={DEADLINE_IDS.map((id) => ({ value: id, label: copy.deadlines[id] }))}
                selected={[values.deadline]}
                onSelect={(value) => update('deadline', value)}
              />
            </>
          )}
          <TextField
            id="dispatch-message"
            field="message"
            multiline
            label={copy.messageLabel}
            value={values.message}
            onChange={(value) => update('message', value)}
            placeholder={copy.messagePlaceholder}
            maxLength={CONTACT_BOUNDS.message.max}
            onBlur={() => touch('message')}
            error={errorText('message')}
          />

          <button
            type="submit"
            data-dispatch-submit-btn
            disabled={!validation.ok}
            aria-describedby={validation.ok ? undefined : SUBMIT_HINT_ID}
            className="w-full py-3.5 px-6 border-2 border-paper-white bg-bebop-red text-space-base font-mono font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-paper-white hover:text-space-base transition-all duration-150 shadow-[4px_4px_0_var(--color-paper-white)] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:bg-bebop-red"
          >
            <span>{copy.submitCta}</span>
          </button>
          {!validation.ok && (
            <p id={SUBMIT_HINT_ID} data-dispatch-submit-hint className="text-[11px] text-muted-gray uppercase tracking-wider">
              {copy.missingPrefix} {missingFields.join(', ')}
            </p>
          )}
        </form>
      ) : (
        <DispatchReceipt brief={brief} copy={copy} to={PROFILE.email} dispatchTime={dispatchTime} onReset={handleReset} />
      )}
    </div>
  );
};

export default BountyDispatch;
