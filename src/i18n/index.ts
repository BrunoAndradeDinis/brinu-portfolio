import { useState, useEffect, useCallback } from 'react';
import {
  DICTIONARIES,
  type Locale,
  type TranslationSchema,
} from './dictionaries.ts';
import { getLocalizedCases } from '../data/cases.ts';
import { getArsenalCounter, getLocalizedArsenal } from '../data/arsenal.ts';
import { getLocalizedArchive } from '../data/archive.ts';
import { getLocalizedStickers } from '../data/stickers.ts';
import { getLocalizedCareer, getLocalizedEducation } from '../data/career.ts';
import { renderRansomTitleDom } from '../components/p5/ransom.ts';

export { DICTIONARIES, type Locale, type TranslationSchema };

export const LOCALE_STORAGE_KEY = 'brinu_locale';
export const LOCALE_CHANGE_EVENT = 'brinu:locale-change';

let currentLocale: Locale = 'pt-br';
let activeWipeTimer: ReturnType<typeof setTimeout> | null = null;
let isBindingsInitialized = false;

export function sanitizeLocale(value: unknown): Locale {
  if (value === 'en' || value === 'pt-br') {
    return value;
  }
  return 'pt-br';
}

export function localeToHtmlLang(locale: Locale): 'pt-BR' | 'en' {
  return locale === 'en' ? 'en' : 'pt-BR';
}

export function localeToOgLocale(locale: Locale): 'pt_BR' | 'en_US' {
  return sanitizeLocale(locale) === 'en' ? 'en_US' : 'pt_BR';
}

export function readStoredLocale(storage?: Pick<Storage, 'getItem'> | null): Locale {
  try {
    const targetStorage =
      storage !== undefined
        ? storage
        : typeof window !== 'undefined' && window.localStorage
          ? window.localStorage
          : null;
    if (!targetStorage) return 'pt-br';
    const raw = targetStorage.getItem(LOCALE_STORAGE_KEY);
    return sanitizeLocale(raw);
  } catch {
    return 'pt-br';
  }
}

export function writeStoredLocale(
  locale: Locale,
  storage?: Pick<Storage, 'setItem'> | null
): void {
  try {
    const targetStorage =
      storage !== undefined
        ? storage
        : typeof window !== 'undefined' && window.localStorage
          ? window.localStorage
          : null;
    if (!targetStorage) return;
    targetStorage.setItem(LOCALE_STORAGE_KEY, sanitizeLocale(locale));
  } catch {
    // Storage access denied or quota exceeded; continue in-memory
  }
}

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = readStoredLocale();
    currentLocale = stored;
  }
  return currentLocale;
}

export function getDictionary(locale: Locale = getLocale()): TranslationSchema {
  return DICTIONARIES[sanitizeLocale(locale)];
}

export function resolveTranslationKey(
  locale: Locale,
  keyPath: string
): string {
  const dict = DICTIONARIES[sanitizeLocale(locale)];
  const segments = keyPath.split('.');
  let cursor: unknown = dict;

  for (const segment of segments) {
    if (cursor && typeof cursor === 'object' && segment in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[segment];
    } else {
      return keyPath;
    }
  }

  return typeof cursor === 'string' ? cursor : keyPath;
}

export function applyDomTranslations(locale: Locale): void {
  if (typeof document === 'undefined') return;

  const validLocale = sanitizeLocale(locale);
  const dict = DICTIONARIES[validLocale];

  document.documentElement.lang = localeToHtmlLang(validLocale);
  document.documentElement.setAttribute('data-locale', validLocale);

  const isWhoamiRoute =
    typeof window !== 'undefined' &&
    window.location.pathname.includes('/whoami');

  const isStickersRoute =
    typeof window !== 'undefined' &&
    window.location.pathname.includes('/stickers');

  const resolvedTitle = isWhoamiRoute
    ? dict.meta.whoamiTitle
    : isStickersRoute
      ? dict.meta.stickersTitle
      : dict.meta.title;
  const resolvedDesc = isWhoamiRoute
    ? dict.meta.whoamiDescription
    : isStickersRoute
      ? dict.meta.stickersDescription
      : dict.meta.description;

  document.title = resolvedTitle;

  const metaDesc = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]'
  );
  if (metaDesc) {
    metaDesc.content = resolvedDesc;
  }

  const updateMetaContent = (selector: string, content: string) => {
    const el = document.querySelector<HTMLMetaElement>(selector);
    if (el) {
      el.setAttribute('content', content);
    }
  };

  updateMetaContent('meta[property="og:title"]', resolvedTitle);
  updateMetaContent('meta[property="og:description"]', resolvedDesc);
  updateMetaContent('meta[property="og:locale"]', localeToOgLocale(validLocale));
  updateMetaContent('meta[name="twitter:title"]', resolvedTitle);
  updateMetaContent('meta[name="twitter:description"]', resolvedDesc);

  // Update all [data-i18n] elements (text or attribute via data-i18n-attr)
  const textNodes = document.querySelectorAll<HTMLElement>('[data-i18n]');
  textNodes.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const translated = resolveTranslationKey(validLocale, key);
    if (translated !== key) {
      const targetAttr = el.getAttribute('data-i18n-attr');
      if (targetAttr) {
        el.setAttribute(targetAttr, translated);
      } else if (el.hasAttribute('data-p5-title')) {
        const wasRevealed = el.getAttribute('data-p5-revealed') !== 'false';
        renderRansomTitleDom(el, translated, { reveal: wasRevealed });
      } else {
        el.textContent = translated;
      }
    }
  });

  // Update all [data-i18n-aria] aria-label attributes
  const ariaNodes = document.querySelectorAll<HTMLElement>('[data-i18n-aria]');
  ariaNodes.forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (!key) return;
    const translated = resolveTranslationKey(validLocale, key);
    if (translated !== key) {
      el.setAttribute('aria-label', translated);
    }
  });

  // Update all [data-i18n-data-text] graffiti overlay attributes
  const graffitiNodes = document.querySelectorAll<HTMLElement>(
    '[data-i18n-data-text]'
  );
  graffitiNodes.forEach((el) => {
    const key = el.getAttribute('data-i18n-data-text');
    if (!key) return;
    const translated = resolveTranslationKey(validLocale, key);
    if (translated !== key) {
      el.setAttribute('data-text', translated);
    }
  });

  // Update localized project case cards
  const cases = getLocalizedCases(validLocale);
  cases.forEach((project) => {
    const card = document.getElementById(`case-${project.id}`);
    if (!card) return;
    const bindField = (selector: string, val: string) => {
      const node = card.querySelector<HTMLElement>(selector);
      if (node) node.textContent = val;
    };
    bindField('[data-case-reel]', `[ ${project.reelNumber} ] // ${project.category}`);
    bindField('[data-case-badge]', project.badge);
    bindField('[data-case-title]', project.title);
    bindField('[data-case-subtitle]', project.subtitle);
    bindField('[data-case-description]', project.description);
    bindField('[data-case-challenge]', project.challenge);
    bindField('[data-case-solution]', project.solution);
    bindField('[data-case-metric]', project.metric);

    const stackItems = card.querySelectorAll<HTMLElement>('[data-case-stack-item]');
    stackItems.forEach((item, idx) => {
      if (project.stack[idx]) {
        item.textContent = project.stack[idx];
      }
    });

    const linkItems = card.querySelectorAll<HTMLAnchorElement>('[data-case-link]');
    linkItems.forEach((linkEl, idx) => {
      const linkData = project.links[idx];
      if (linkData) {
        linkEl.setAttribute('aria-label', linkData.ariaLabel);
        const labelSpan = linkEl.querySelector<HTMLElement>('[data-case-link-label]');
        if (labelSpan) labelSpan.textContent = linkData.label;
      }
    });
  });

  cases.forEach((project) => {
    const card = document.getElementById(`arcana-${project.id}`);
    if (!card) return;
    const setText = (selector: string, value: string) => {
      const node = card.querySelector<HTMLElement>(selector);
      if (node) node.textContent = value;
    };
    setText('[data-arcana-title]', project.title);
    setText('[data-arcana-category]', project.category);
    setText('[data-arcana-challenge]', project.challenge);
    setText('[data-arcana-solution]', project.solution);
    const cardLabel = `${project.arcanaCode}: ${project.title}`;
    card.setAttribute('aria-label', cardLabel);
    card.querySelector('[data-arcana-toggle]')?.setAttribute('aria-label', cardLabel);
    card.querySelectorAll<HTMLElement>('[data-arcana-stack-item]').forEach((item, idx) => {
      if (project.stack[idx]) item.textContent = project.stack[idx];
    });
    card.querySelectorAll<HTMLAnchorElement>('[data-arcana-link]').forEach((linkEl, idx) => {
      const linkData = project.links[idx];
      if (!linkData) return;
      linkEl.setAttribute('aria-label', linkData.ariaLabel);
      const label = linkEl.querySelector<HTMLElement>('[data-arcana-link-label]');
      if (label) label.textContent = linkData.label;
    });
  });

  getLocalizedStickers(validLocale).forEach((sticker) => {
    const link = document.getElementById(`sticker-${sticker.id}`);
    if (!link) return;
    link.setAttribute('aria-label', `${dict.stickers.downloadAria} ${sticker.alt}`);
    link.querySelector('img')?.setAttribute('alt', sticker.alt);
  });

  getLocalizedArchive(validLocale).forEach((entry) => {
    const card = document.getElementById(`archive-${entry.id}`);
    if (!card) return;
    const setText = (selector: string, value: string) => {
      const node = card.querySelector<HTMLElement>(selector);
      if (node) node.textContent = value;
    };
    setText('[data-archive-title]', entry.title);
    setText('[data-archive-description]', entry.description);
    if (entry.status) setText('[data-archive-status]', entry.status);
    card.querySelectorAll<HTMLElement>('[data-archive-link-label]').forEach((label, idx) => {
      const link = entry.links[idx];
      if (link) label.textContent = link.label;
    });
  });

  getLocalizedCareer(validLocale).forEach((entry) => {
    const item = document.getElementById(`career-${entry.id}`);
    if (!item) return;
    const role = item.querySelector<HTMLElement>('[data-career-role]');
    const period = item.querySelector<HTMLElement>('[data-career-period]');
    const summary = item.querySelector<HTMLElement>('[data-career-summary]');
    if (role) role.textContent = entry.role;
    if (period) period.textContent = entry.period;
    if (summary) summary.textContent = entry.summary;
  });

  getLocalizedEducation(validLocale).forEach((entry) => {
    const item = document.getElementById(`education-${entry.id}`);
    if (!item) return;
    const course = item.querySelector<HTMLElement>('[data-education-course]');
    const period = item.querySelector<HTMLElement>('[data-education-period]');
    const status = item.querySelector<HTMLElement>('[data-education-status]');
    if (course) course.textContent = entry.course;
    if (period) period.textContent = entry.period;
    if (status) status.textContent = entry.status;
  });

  getLocalizedArsenal(validLocale).forEach((domain) => {
    const vignette = document.querySelector<HTMLElement>(`[data-skill-vignette="${domain.id}"]`);
    if (!vignette) return;
    const titleEl = vignette.querySelector<HTMLElement>('[data-skill-title]');
    if (titleEl) titleEl.textContent = domain.title;
    domain.skills
      .flatMap((skill) => skill.evidence)
      .forEach((evidence) => {
        vignette.querySelectorAll<HTMLElement>(`[data-evidence-link="${evidence.ref}"]`).forEach((link) => {
          link.textContent = evidence.label;
        });
      });
  });
  const counterEl = document.querySelector<HTMLElement>('[data-arsenal-counter]');
  if (counterEl) counterEl.textContent = getArsenalCounter(validLocale);

  // Update all [data-lang-toggle] buttons
  const toggles = document.querySelectorAll<HTMLElement>('[data-lang-toggle]');
  toggles.forEach((btn) => {
    btn.setAttribute('data-active-locale', validLocale);
    const labelEl = btn.querySelector<HTMLElement>('[data-lang-toggle-label]');
    if (labelEl) {
      labelEl.textContent = validLocale === 'pt-br' ? 'PT-BR' : 'EN';
    }
  });
}

export function triggerPersonaWipe(onMidpoint: () => void): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    onMidpoint();
    return;
  }

  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    onMidpoint();
    return;
  }

  const wipeEl = document.getElementById('p5-wipe-overlay');
  if (!wipeEl) {
    onMidpoint();
    return;
  }

  if (activeWipeTimer) {
    clearTimeout(activeWipeTimer);
    activeWipeTimer = null;
  }

  wipeEl.classList.remove('is-wiping');
  void wipeEl.offsetWidth;
  wipeEl.classList.add('is-wiping');

  onMidpoint();

  activeWipeTimer = setTimeout(() => {
    wipeEl.classList.remove('is-wiping');
    activeWipeTimer = null;
  }, 420);
}

export function setLocale(
  next: Locale,
  options: { animate?: boolean } = { animate: true }
): Locale {
  const validNext = sanitizeLocale(next);
  currentLocale = validNext;
  writeStoredLocale(validNext);

  const commitChange = () => {
    applyDomTranslations(validNext);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<{ locale: Locale }>(LOCALE_CHANGE_EVENT, {
          detail: { locale: validNext },
        })
      );
    }
  };

  if (options.animate) {
    triggerPersonaWipe(commitChange);
  } else {
    commitChange();
  }

  return validNext;
}

export function toggleLocale(): Locale {
  const current = getLocale();
  const next: Locale = current === 'pt-br' ? 'en' : 'pt-br';
  return setLocale(next, { animate: true });
}

export function initI18nBindings(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const initial = readStoredLocale();
  currentLocale = initial;
  applyDomTranslations(initial);

  if (isBindingsInitialized) return;
  isBindingsInitialized = true;

  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    const toggleBtn = target?.closest<HTMLElement>('[data-lang-toggle]');
    if (!toggleBtn) return;

    e.preventDefault();
    const explicitLocale = toggleBtn.getAttribute('data-set-locale');
    if (explicitLocale === 'pt-br' || explicitLocale === 'en') {
      if (explicitLocale !== getLocale()) {
        setLocale(explicitLocale, { animate: true });
      }
    } else {
      toggleLocale();
    }
  });
}

export function useLocale(): {
  locale: Locale;
  dict: TranslationSchema;
  setLocale: (next: Locale) => Locale;
  toggleLocale: () => Locale;
} {
  const [locale, setLocaleState] = useState<Locale>('pt-br');

  useEffect(() => {
    setLocaleState(getLocale());

    const handleLocaleChange = (event: Event) => {
      const custom = event as CustomEvent<{ locale: Locale }>;
      if (custom.detail?.locale) {
        setLocaleState(sanitizeLocale(custom.detail.locale));
      } else {
        setLocaleState(getLocale());
      }
    };

    window.addEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);
    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);
    };
  }, []);

  const updateLocale = useCallback((next: Locale) => {
    return setLocale(next, { animate: true });
  }, []);

  const flipLocale = useCallback(() => {
    return toggleLocale();
  }, []);

  return {
    locale,
    dict: DICTIONARIES[locale],
    setLocale: updateLocale,
    toggleLocale: flipLocale,
  };
}
