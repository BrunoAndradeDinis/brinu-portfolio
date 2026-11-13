import { gsap } from './motion.ts';
import { typeDuration, visibleChars, type TypeKind } from './text-type.ts';

const typing = new WeakMap<HTMLElement, gsap.core.Tween>();

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Types the element's text from empty to full. The untyped rest stays in the DOM at opacity 0,
 * so the block keeps its final size and screen readers get the whole text.
 */
export function typeText(element: HTMLElement): void {
  if (typing.get(element)?.isActive()) return;
  const text = (element.textContent ?? '').trim();
  if (prefersReducedMotion() || text.length === 0) return;

  const kind: TypeKind = element.dataset.type === 'paragraph' ? 'paragraph' : 'label';
  const duration = typeDuration(text.length, kind);
  const typed = document.createElement('span');
  const pending = document.createElement('span');
  pending.style.opacity = '0';
  pending.textContent = text;
  element.replaceChildren(typed, pending);

  const clock = { elapsed: 0 };
  // A locale switch rewrites the element's text; from then on the element is no longer ours to write.
  const ownsText = () => pending.parentNode === element;
  const tween = gsap.to(clock, {
    elapsed: duration,
    duration: duration / 1000,
    ease: 'none',
    onUpdate: () => {
      if (!ownsText()) {
        tween.kill();
        return;
      }
      const count = visibleChars(text.length, kind, clock.elapsed);
      typed.textContent = text.slice(0, count);
      pending.textContent = text.slice(count);
    },
    onComplete: () => {
      if (ownsText()) element.textContent = text;
    },
  });
  typing.set(element, tween);
}

/** Types every `[data-type]` block under `root` when it enters the viewport; returns the unbind function. */
export function bindTypedText(root: ParentNode): () => void {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const element = entry.target as HTMLElement;
      if (!entry.isIntersecting || !element.checkVisibility({ visibilityProperty: true })) continue;
      observer.unobserve(element);
      typeText(element);
    }
  });
  root.querySelectorAll<HTMLElement>('[data-type]').forEach((element) => observer.observe(element));
  return () => observer.disconnect();
}
