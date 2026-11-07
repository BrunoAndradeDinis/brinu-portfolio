export interface RansomFontEntry {
  readonly token: 'display' | 'body' | 'mono' | 'spray';
  readonly stack: string;
}

export interface RansomChar {
  readonly char: string;
  readonly index: number;
  readonly fontToken: RansomFontEntry['token'];
  readonly fontStack: string;
  readonly rotationDeg: number;
}

export interface RansomWord {
  readonly word: string;
  readonly chars: readonly RansomChar[];
}

export const RANSOM_FONT_STACKS: readonly RansomFontEntry[] = [
  { token: 'display', stack: 'var(--font-display, Impact, sans-serif)' },
  { token: 'body', stack: 'var(--font-body, system-ui, sans-serif)' },
  { token: 'mono', stack: 'var(--font-mono, ui-monospace, monospace)' },
  { token: 'spray', stack: 'var(--font-spray, fantasy, cursive)' },
] as const;

const ROTATION_PATTERN: readonly number[] = [
  -6.5, 5.2, -4.0, 7.1, -5.8, 3.6, -7.4, 4.8, -3.2, 6.4, -4.9, 5.7,
] as const;

export function planRansomTitle(rawText: string): RansomWord[] {
  const normalized = rawText.trim().replace(/\s+/g, ' ');
  if (!normalized) return [];

  const tokens = normalized.split(' ');
  let globalIndex = 0;

  return tokens.map((word) => {
    const glyphs = Array.from(word);
    let prevFontIdx = -1;
    const chars: RansomChar[] = glyphs.map((char, idx) => {
      const code = char.codePointAt(0) ?? 65;
      const fontIdx = (globalIndex + (idx === 0 ? code % 2 : 0)) % RANSOM_FONT_STACKS.length;
      const resolvedFontIdx =
        fontIdx === prevFontIdx ? (fontIdx + 1) % RANSOM_FONT_STACKS.length : fontIdx;
      prevFontIdx = resolvedFontIdx;
      const fontEntry = RANSOM_FONT_STACKS[resolvedFontIdx] ?? RANSOM_FONT_STACKS[0];

      const rawRot = ROTATION_PATTERN[(globalIndex + (code % 3)) % ROTATION_PATTERN.length] ?? -4.5;
      const clampedRot = Math.max(-8, Math.min(8, rawRot));
      const rotationDeg = clampedRot === 0 ? 3.5 : clampedRot;

      const item: RansomChar = {
        char,
        index: globalIndex,
        fontToken: fontEntry.token,
        fontStack: fontEntry.stack,
        rotationDeg,
      };
      globalIndex += 1;
      return item;
    });

    return { word, chars };
  });
}

export function renderRansomTitleDom(
  el: HTMLElement,
  explicitText?: string,
  options: { reveal?: boolean } = {}
): void {
  const sourceText = (
    explicitText ??
    el.getAttribute('data-p5-raw-text') ??
    el.getAttribute('aria-label') ??
    el.textContent ??
    ''
  )
    .trim()
    .replace(/\s+/g, ' ');

  if (!sourceText) return;

  const shouldReveal = options.reveal ?? true;
  el.setAttribute('aria-label', sourceText);
  el.setAttribute('data-p5-raw-text', sourceText);
  el.setAttribute('data-p5-split', 'true');
  el.setAttribute('data-p5-revealed', shouldReveal ? 'true' : 'false');

  const plannedWords = planRansomTitle(sourceText);
  const doc = el.ownerDocument;
  el.textContent = '';

  plannedWords.forEach((wordPlan, wIdx) => {
    const wordSpan = doc.createElement('span');
    wordSpan.setAttribute('data-p5-word', '');
    wordSpan.setAttribute('aria-hidden', 'true');
    wordSpan.style.display = 'inline-block';
    wordSpan.style.whiteSpace = 'nowrap';

    wordPlan.chars.forEach((charPlan) => {
      const charSpan = doc.createElement('span');
      charSpan.setAttribute('data-p5-char', '');
      charSpan.setAttribute('aria-hidden', 'true');
      charSpan.setAttribute('data-p5-font', charPlan.fontToken);
      charSpan.setAttribute('data-p5-rot', String(charPlan.rotationDeg));
      charSpan.style.display = 'inline-block';
      charSpan.style.fontFamily = charPlan.fontStack;
      charSpan.style.transform = shouldReveal
        ? `rotate(${charPlan.rotationDeg}deg)`
        : 'rotate(0deg)';
      charSpan.textContent = charPlan.char;
      wordSpan.appendChild(charSpan);
    });

    el.appendChild(wordSpan);
    if (wIdx < plannedWords.length - 1) {
      el.appendChild(doc.createTextNode(' '));
    }
  });
}

export function revealRansomTitleDom(el: HTMLElement): HTMLElement[] {
  if (el.getAttribute('data-p5-split') !== 'true') {
    renderRansomTitleDom(el, undefined, { reveal: true });
  } else {
    el.setAttribute('data-p5-revealed', 'true');
  }
  const chars = Array.from(el.querySelectorAll<HTMLElement>('[data-p5-char]'));
  chars.forEach((charSpan) => {
    const deg = Number(charSpan.getAttribute('data-p5-rot') ?? '0') || -4;
    charSpan.style.transform = `rotate(${deg}deg)`;
  });
  return chars;
}
