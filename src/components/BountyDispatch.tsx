import React, { useState } from 'react';
import { audioSynth } from '../utils/audio';
import { useLocale } from '../i18n/index';
import { PROFILE } from '../data/profile';

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export const BountyDispatch: React.FC = () => {
  const { dict: t } = useLocale();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [dispatchTime, setDispatchTime] = useState<string>('');

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = t.dispatch.nameError;
    }

    if (!email.trim()) {
      nextErrors.email = t.dispatch.emailRequiredError;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = t.dispatch.emailInvalidError;
    }

    if (!message.trim()) {
      nextErrors.message = t.dispatch.messageEmptyError;
    } else if (message.trim().length < 10) {
      nextErrors.message = t.dispatch.messageShortError;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      if (!audioSynth.isMuted()) {
        audioSynth.playAlarm8Bit(1);
      }
      return;
    }

    setIsSubmitted(true);
    setDispatchTime(new Date().toUTCString());

    if (!audioSynth.isMuted()) {
      audioSynth.playBountyAcquired();
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setMessage('');
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <div
      data-bounty-dispatch
      className="border-4 border-space-base bg-space-base p-6 sm:p-8 font-mono shadow-[8px_8px_0_var(--color-bebop-red)] text-paper-white relative overflow-hidden"
    >
      <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-bebop-red">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 bg-bebop-red" />
          <span className="font-bold text-xs uppercase tracking-widest text-bebop-red">
            {t.dispatch.headerTitle}
          </span>
        </div>

        <span className="text-[10px] sm:text-xs text-muted-gray uppercase">
          {t.dispatch.headerSub}
        </span>
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="dispatch-name"
              className="block text-xs uppercase tracking-wider text-paper-white mb-1.5 font-bold"
            >
              {t.dispatch.nameLabel}
            </label>
            <input
              id="dispatch-name"
              data-input-name
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder={t.dispatch.namePlaceholder}
              className={`w-full px-4 py-3 border-2 bg-space-base text-paper-white placeholder:text-muted-gray/60 text-xs sm:text-sm font-mono focus:outline-none transition-all ${
                errors.name
                  ? 'border-bebop-red focus:ring-2 focus:ring-bebop-red'
                  : 'border-paper-white focus:border-bebop-red'
              }`}
            />
            {errors.name && (
              <span data-error-name className="text-bebop-red text-[11px] mt-1.5 flex items-center gap-1.5 font-bold">
                <span>■</span>
                <span>{errors.name}</span>
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="dispatch-email"
              className="block text-xs uppercase tracking-wider text-paper-white mb-1.5 font-bold"
            >
              {t.dispatch.emailLabel}
            </label>
            <input
              id="dispatch-email"
              data-input-email
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder={t.dispatch.emailPlaceholder}
              className={`w-full px-4 py-3 border-2 bg-space-base text-paper-white placeholder:text-muted-gray/60 text-xs sm:text-sm font-mono focus:outline-none transition-all ${
                errors.email
                  ? 'border-bebop-red focus:ring-2 focus:ring-bebop-red'
                  : 'border-paper-white focus:border-bebop-red'
              }`}
            />
            {errors.email && (
              <span data-error-email className="text-bebop-red text-[11px] mt-1.5 flex items-center gap-1.5 font-bold">
                <span>■</span>
                <span>{errors.email}</span>
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="dispatch-message"
              className="block text-xs uppercase tracking-wider text-paper-white mb-1.5 font-bold"
            >
              {t.dispatch.messageLabel}
            </label>
            <textarea
              id="dispatch-message"
              data-input-message
              rows={4}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
              }}
              placeholder={t.dispatch.messagePlaceholder}
              className={`w-full px-4 py-3 border-2 bg-space-base text-paper-white placeholder:text-muted-gray/60 text-xs sm:text-sm font-mono focus:outline-none transition-all resize-none ${
                errors.message
                  ? 'border-bebop-red focus:ring-2 focus:ring-bebop-red'
                  : 'border-paper-white focus:border-bebop-red'
              }`}
            />
            {errors.message && (
              <span data-error-message className="text-bebop-red text-[11px] mt-1.5 flex items-center gap-1.5 font-bold">
                <span>■</span>
                <span>{errors.message}</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            data-dispatch-submit-btn
            className="w-full py-3.5 px-6 border-2 border-paper-white bg-bebop-red text-space-base font-mono font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-paper-white hover:text-space-base transition-all duration-150 shadow-[4px_4px_0_var(--color-paper-white)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t.dispatch.submitCta}</span>
          </button>
        </form>
      ) : (
        <div data-dispatch-receipt className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 p-3.5 bg-bebop-red border-2 border-paper-white text-space-base">
            <span className="w-2.5 h-2.5 bg-space-base animate-ping" />
            <span className="font-bold text-xs uppercase tracking-wider">
              {t.dispatch.receiptSuccess}
            </span>
          </div>

          <div className="p-4 border-2 border-paper-white bg-space-base space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-paper-white/30 pb-1.5">
              <span className="text-muted-gray">{t.dispatch.codenameKey}</span>
              <span className="text-paper-white font-bold">{name}</span>
            </div>
            <div className="flex justify-between border-b border-paper-white/30 pb-1.5">
              <span className="text-muted-gray">{t.dispatch.frequencyKey}</span>
              <span className="text-bebop-red font-bold">{email}</span>
            </div>
            <div className="flex justify-between border-b border-paper-white/30 pb-1.5">
              <span className="text-muted-gray">{t.dispatch.statusKey}</span>
              <span className="text-paper-white font-bold">{t.dispatch.statusValue}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-muted-gray">{t.dispatch.timestampKey}</span>
              <span className="text-muted-gray text-[10px]">{dispatchTime}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`mailto:${PROFILE.email}?subject=${encodeURIComponent(
                `[Bounty Contract] Proposta de ${name}`
              )}&body=${encodeURIComponent(
                `Codename: ${name}\nEmail: ${email}\n\nMensagem:\n${message}`
              )}`}
              className="flex-1 py-3 px-4 border-2 border-paper-white bg-bebop-red text-space-base text-center font-bold text-xs uppercase tracking-wider hover:bg-paper-white hover:text-space-base transition-all inline-flex items-center justify-center gap-2"
            >
              <span>{t.dispatch.sendEmailCopy}</span>
            </a>

            <button
              type="button"
              data-new-transmission-btn
              onClick={handleReset}
              className="py-3 px-4 border-2 border-paper-white bg-space-base text-paper-white font-bold text-xs uppercase tracking-wider hover:bg-paper-white hover:text-space-base transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.dispatch.newTransmission}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BountyDispatch;
