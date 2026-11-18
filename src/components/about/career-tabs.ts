import { LOCALE_CHANGE_EVENT } from '../../i18n';

const TYPE_INTERVAL_MS = 16;
const MAX_TICKS = 190;
const TAB_KEYS = ['info', 'details', 'learned'] as const;

type TabKey = (typeof TAB_KEYS)[number];

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function typeSequentially(targets: HTMLElement[], timers: Set<number>, onDone: () => void): void {
  const texts = targets.map((el) => el.textContent ?? '');
  const perTick = Math.max(1, Math.ceil(texts.reduce((sum, text) => sum + text.length, 0) / MAX_TICKS));
  targets.forEach((el, index) => {
    el.dataset.fullText = texts[index];
    el.textContent = '';
    el.classList.add('is-typing');
  });
  let index = 0;
  let cursor = 0;

  const step = () => {
    const el = targets[index];
    if (!el) {
      onDone();
      return;
    }
    cursor = Math.min(texts[index].length, cursor + perTick);
    el.textContent = texts[index].slice(0, cursor);
    if (cursor >= texts[index].length) {
      el.classList.remove('is-typing');
      delete el.dataset.fullText;
      index += 1;
      cursor = 0;
    }
    timers.add(window.setTimeout(step, TYPE_INTERVAL_MS));
  };
  timers.add(window.setTimeout(step, TYPE_INTERVAL_MS));
}

export function initCareerTabs(root: HTMLElement): () => void {
  const cleanups: Array<() => void> = [];
  const cancellers: Array<(restore: boolean) => void> = [];

  root.querySelectorAll<HTMLElement>('[data-career-entry]').forEach((entry) => {
    const tabs = Array.from(entry.querySelectorAll<HTMLButtonElement>('[data-career-tab]'));
    const panels = Array.from(entry.querySelectorAll<HTMLElement>('[data-career-panel]'));
    const timers = new Set<number>();

    const cancelTyping = (restore: boolean) => {
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      entry.querySelectorAll<HTMLElement>('[data-full-text]').forEach((el) => {
        if (restore) el.textContent = el.dataset.fullText ?? el.textContent;
        delete el.dataset.fullText;
      });
      entry.querySelectorAll<HTMLElement>('.is-typing').forEach((el) => el.classList.remove('is-typing'));
      panels.forEach((panel) => panel.removeAttribute('aria-busy'));
    };
    cancellers.push(cancelTyping);

    const select = (key: TabKey, focus = false) => {
      cancelTyping(true);
      tabs.forEach((tab) => {
        const on = tab.dataset.careerTab === key;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        if (on && focus) tab.focus();
      });
      panels.forEach((panel) => {
        const on = panel.dataset.careerPanel === key;
        panel.hidden = !on;
        if (!on || panel.dataset.typed === 'true') return;
        panel.dataset.typed = 'true';
        const targets = Array.from(panel.querySelectorAll<HTMLElement>('[data-typed]'));
        if (prefersReducedMotion() || targets.length === 0) return;
        panel.setAttribute('aria-busy', 'true');
        typeSequentially(targets, timers, () => panel.removeAttribute('aria-busy'));
      });
    };

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.careerPanel !== 'info';
    });

    const observer = new IntersectionObserver(
      (records) => {
        if (!records.some((record) => record.isIntersecting)) return;
        observer.disconnect();
        const current = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
        if (current) select(current.dataset.careerTab as TabKey);
      },
      { threshold: 0.6 },
    );
    observer.observe(entry);
    cleanups.push(() => observer.disconnect());

    tabs.forEach((tab, index) => {
      const onClick = () => select(tab.dataset.careerTab as TabKey);
      const onKey = (event: KeyboardEvent) => {
        const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!delta) return;
        event.preventDefault();
        const next = tabs[(index + delta + tabs.length) % tabs.length];
        select(next.dataset.careerTab as TabKey, true);
      };
      tab.addEventListener('click', onClick);
      tab.addEventListener('keydown', onKey);
      cleanups.push(() => {
        tab.removeEventListener('click', onClick);
        tab.removeEventListener('keydown', onKey);
      });
    });
  });

  const onLocaleChange = () => cancellers.forEach((cancel) => cancel(false));
  window.addEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
  return () => {
    window.removeEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
    cleanups.forEach((fn) => fn());
    cancellers.forEach((cancel) => cancel(true));
  };
}
