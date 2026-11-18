import React from 'react';
import type { Locale, TranslationSchema } from '../../i18n/index';
import type { ContactBrief } from '../../utils/contact-brief';
import { formatBrPhone } from '../../utils/contact-sanitize';
import { formatDispatchTime } from '../../utils/dispatch-time';

interface DispatchReceiptProps {
  brief: ContactBrief;
  copy: TranslationSchema['dispatch'];
  locale: Locale;
  sentAt: Date;
  onReset: () => void;
}

export const DispatchReceipt: React.FC<DispatchReceiptProps> = ({ brief, copy, locale, sentAt, onReset }) => {
  const rows: ReadonlyArray<readonly [field: string, key: string, value: string | null]> = [
    ['name', copy.codenameKey, brief.name],
    ['company', copy.companyKey, brief.company],
    ['email', copy.frequencyKey, brief.email],
    ['phone', copy.phoneKey, brief.phone && formatBrPhone(brief.phone)],
    ['services', copy.servicesKey, brief.services.map((id) => copy.services[id]).join(', ')],
    ['budget', copy.budgetKey, brief.budget && copy.budgets[brief.budget]],
    ['deadline', copy.deadlineKey, brief.deadline && copy.deadlines[brief.deadline]],
    ['target', copy.statusKey, copy.statusValue],
  ];

  return (
    <div data-dispatch-receipt className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 p-3.5 bg-bebop-red border-2 border-paper-white text-space-base">
        <span className="w-2.5 h-2.5 shrink-0 bg-space-base animate-ping" />
        <span className="font-bold text-xs uppercase tracking-wider">{copy.receiptSuccess}</span>
      </div>

      <dl className="p-4 border-2 border-paper-white bg-space-base space-y-2.5 text-xs">
        {rows
          .filter(([, , value]) => value)
          .map(([field, key, value]) => (
            <div key={field} data-receipt-row={field} className="flex justify-between gap-3 border-b border-paper-white/30 pb-1.5">
              <dt className="text-muted-gray shrink-0">{key}</dt>
              <dd className="text-paper-white font-bold text-right min-w-0 [overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
        <div className="flex justify-between gap-3 pt-1">
          <dt className="text-muted-gray shrink-0">{copy.timestampKey}</dt>
          <dd data-dispatch-time className="text-muted-gray text-[10px] text-right">
            {formatDispatchTime(sentAt, locale)}
          </dd>
        </div>
      </dl>

      <div className="flex">
        <button
          type="button"
          data-new-transmission-btn
          onClick={onReset}
          className="w-full py-3 px-4 border-2 border-paper-white bg-space-base text-paper-white font-bold text-xs uppercase tracking-wider hover:bg-paper-white hover:text-space-base transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{copy.newTransmission}</span>
        </button>
      </div>
    </div>
  );
};
