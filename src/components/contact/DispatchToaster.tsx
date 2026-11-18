import React from 'react';
import { Toaster } from 'sonner';

const TOAST_CLASS_NAMES = {
  toast:
    'flex w-full items-start gap-3 p-4 border-2 font-mono shadow-[4px_4px_0_var(--color-bebop-red)] data-[type=success]:bg-space-base data-[type=success]:text-paper-white data-[type=success]:border-paper-white data-[type=error]:bg-bebop-red data-[type=error]:text-space-base data-[type=error]:border-space-base data-[type=error]:shadow-[4px_4px_0_var(--color-space-base)]',
  title: 'font-black text-xs uppercase tracking-wider',
  description: 'mt-1 text-xs leading-relaxed [overflow-wrap:anywhere]',
  icon: 'shrink-0 mt-0.5',
};

export const DispatchToaster: React.FC = () => (
  <Toaster position="bottom-right" duration={6000} toastOptions={{ unstyled: true, classNames: TOAST_CLASS_NAMES }} />
);
