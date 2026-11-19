import React, { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { audioSynth } from '../utils/audio';
import { useLocale } from '../i18n/index';
import { PROFILE } from '../data/profile';
import { BUDGET_IDS, CONTACT_BOUNDS, CONTACT_DEFAULTS, CONTACT_ENDPOINT, DEADLINE_IDS, SERVICE_IDS } from '../data/contact-brief';
import { contactChannel, isJobOnly, validateContactBrief, type ContactBrief, type ContactField, type RawContactBrief } from '../utils/contact-brief';
import { buildMailtoHref } from '../utils/contact-mailto';
import { sendBrief } from '../utils/contact-relay';
import { digitsOnly, formatBrPhone } from '../utils/contact-sanitize';
import { CheckboxField, ChoiceGroup, TextField } from './contact/fields';
import { DispatchReceipt } from './contact/DispatchReceipt';
import { DispatchToaster } from './contact/DispatchToaster';

type FormValues = { -readonly [K in keyof RawContactBrief]: RawContactBrief[K] };
type Touched = Partial<Record<ContactField, true>>;

const INITIAL_VALUES: FormValues = {
  name: '',
  company: '',
  email: '',
  phone: '',
  preferWhatsapp: false,
  services: [],
  budget: CONTACT_DEFAULTS.budget,
  deadline: CONTACT_DEFAULTS.deadline,
  message: '',
};

const ALL_TOUCHED: Touched = { name: true, email: true, phone: true, services: true, message: true };

const FIELD_ORDER: readonly ContactField[] = ['name', 'email', 'phone', 'services', 'message'];
const SUBMIT_HINT_ID = 'dispatch-submit-hint';
const HONEYPOT_ID = 'dispatch-bounty-ref';

const PHONE_PASTE_LENGTH = 25;

function nextPhoneValue(previous: string, typed: string): string {
  const growsByOneKey = typed.length === previous.length + 1;
  const previousIsComplete = digitsOnly(previous).length === 11;
  return growsByOneKey && previousIsComplete ? previous : formatBrPhone(typed);
}

export const BountyDispatch: React.FC = () => {
  const { dict: t, locale } = useLocale();
  const copy = t.dispatch;
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [touched, setTouched] = useState<Touched>({});
  const [honeypot, setHoneypot] = useState('');
  const [brief, setBrief] = useState<ContactBrief | null>(null);
  const [sentAt, setSentAt] = useState<Date | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);

  const validation = useMemo(() => validateContactBrief(values), [values]);
  const liveErrors = validation.ok ? {} : validation.errors;
  const missingFields = FIELD_ORDER.filter((field) => liveErrors[field]).map((field) => copy.mail[field]);

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const touch = (field: ContactField) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const togglePreferWhatsapp = (checked: boolean) => {
    update('preferWhatsapp', checked);
    if (checked) touch('phone');
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

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validation.ok) {
      setTouched(ALL_TOUCHED);
      return;
    }
    if (inFlight.current) return;

    inFlight.current = true;
    setSending(true);
    setFailed(false);
    const submitted = validation.brief;
    const submittedAt = new Date();
    const result = await sendBrief({ endpoint: CONTACT_ENDPOINT, brief: submitted, honeypot, locale });
    inFlight.current = false;
    setSending(false);

    if (result.ok) {
      setBrief(submitted);
      setSentAt(submittedAt);
      const description = contactChannel(submitted) === 'whatsapp' ? copy.toastSuccessBodyWhatsapp : copy.toastSuccessBody;
      toast.success(copy.toastSuccessTitle, { description });
      if (!audioSynth.isMuted()) audioSynth.playBountyAcquired();
      return;
    }

    setFailed(true);
    if (result.code === 'rate-limited') {
      toast.error(copy.toastRateLimitedTitle, { description: copy.toastRateLimitedBody });
    } else {
      toast.error(copy.toastErrorTitle, { description: copy.toastErrorBody });
    }
  };

  const handleReset = () => {
    setValues(INITIAL_VALUES);
    setTouched({});
    setHoneypot('');
    setFailed(false);
    setBrief(null);
    setSentAt(null);
  };

  const fallbackHref =
    failed && validation.ok
      ? buildMailtoHref(
          validation.brief,
          {
            subjectPrefix: copy.mailSubjectPrefix,
            labels: copy.mail,
            channels: copy.channels,
            services: copy.services,
            budgets: copy.budgets,
            deadlines: copy.deadlines,
          },
          PROFILE.email,
        )
      : null;

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

      <DispatchToaster />

      {!brief || !sentAt ? (
        <form onSubmit={handleSubmit} noValidate aria-busy={sending} className="space-y-5" data-dispatch-form>
          <div aria-hidden="true" className="absolute -left-[10000px] top-auto w-px h-px overflow-hidden">
            <label htmlFor={HONEYPOT_ID}>{copy.honeypotLabel}</label>
            <input
              id={HONEYPOT_ID}
              name="bounty_ref"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              data-form-type="other"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              data-dispatch-honeypot
            />
          </div>
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
            optionalTag={values.preferWhatsapp ? undefined : copy.optionalTag}
            value={values.phone}
            onChange={(value) => update('phone', nextPhoneValue(values.phone, value))}
            placeholder={copy.phonePlaceholder}
            maxLength={PHONE_PASTE_LENGTH}
            autoComplete="tel-national"
            onBlur={() => touch('phone')}
            error={errorText('phone')}
          />
          <CheckboxField
            id="dispatch-prefer-whatsapp"
            field="prefer-whatsapp"
            label={copy.preferWhatsappLabel}
            hint={copy.preferWhatsappHint}
            checked={values.preferWhatsapp}
            onChange={togglePreferWhatsapp}
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
            label={showBudgetAndDeadline ? copy.messageLabel : copy.messageLabel.replace(/^08/, '06')}
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
            disabled={!validation.ok || sending}
            aria-describedby={validation.ok ? undefined : SUBMIT_HINT_ID}
            className="w-full py-3.5 px-6 border-2 border-paper-white bg-bebop-red text-space-base font-mono font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-paper-white hover:text-space-base transition-all duration-150 shadow-[4px_4px_0_var(--color-paper-white)] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:bg-bebop-red"
          >
            <span>{sending ? copy.sendingCta : copy.submitCta}</span>
          </button>
          {!validation.ok && (
            <p id={SUBMIT_HINT_ID} data-dispatch-submit-hint className="text-[11px] text-muted-gray uppercase tracking-wider">
              {copy.missingPrefix} {missingFields.join(', ')}
            </p>
          )}
          {fallbackHref && (
            <p data-dispatch-fallback className="text-[11px] text-paper-white uppercase tracking-wider flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{copy.fallbackLead}</span>
              <a href={fallbackHref} data-dispatch-mailto className="text-bebop-red font-bold underline underline-offset-2 break-words">
                {copy.sendEmailCopy}
              </a>
            </p>
          )}
        </form>
      ) : (
        <DispatchReceipt brief={brief} copy={copy} locale={locale} sentAt={sentAt} onReset={handleReset} />
      )}
    </div>
  );
};

export default BountyDispatch;
