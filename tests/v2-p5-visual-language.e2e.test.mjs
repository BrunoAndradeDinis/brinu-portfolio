import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

let server;
let baseUrl = '';
let browser;

async function dismissIntroIfPresent(page) {
  await page.evaluate(() => {
    const el = document.getElementById('intro-preloader');
    if (el) {
      el.click();
      el.remove();
    }
    window.dispatchEvent(new CustomEvent('intro-complete'));
  });
}

async function openHome(locale = 'pt-br', contextOptions = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...contextOptions,
  });
  const page = await context.newPage();
  await page.addInitScript((loc) => {
    window.localStorage.setItem('brinu_locale', loc);
  }, locale);
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);
  return { context, page };
}

before(async () => {
  const distDir = path.resolve('dist');
  server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
    let pathname = decodeURIComponent(reqUrl.pathname);
    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    } else if (!path.extname(pathname)) {
      pathname += '/index.html';
    }
    const filePath = path.join(distDir, pathname);
    if (!filePath.startsWith(distDir) || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (fs.existsSync('/usr/bin/google-chrome')) {
    launchOptions.executablePath = '/usr/bin/google-chrome';
  }
  browser = await chromium.launch(launchOptions);
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

test('C12: html background color matches the section occupying the top of the viewport', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    for (const sectionId of ['#hero', '#works', '#about', '#contact']) {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const top = window.scrollY + el.getBoundingClientRect().top + 24;
        window.scrollTo({ top, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
      }, sectionId);
      await page.waitForTimeout(60);

      const colors = await page.evaluate((sel) => {
        const sec = document.querySelector(sel);
        return {
          htmlBg: window.getComputedStyle(document.documentElement).backgroundColor,
          sectionBg: sec ? window.getComputedStyle(sec).backgroundColor : null,
        };
      }, sectionId);

      assert.equal(
        colors.htmlBg,
        colors.sectionBg,
        `Expected <html> background (${colors.htmlBg}) to match ${sectionId} background (${colors.sectionBg})`
      );
    }
  } finally {
    await context.close();
  }
});

test('C14: activating an in-page anchor link stops target at least 8px below visible nav controls', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    const urianaChip = page.locator('#arsenal a[href="#case-uriana"]').first();
    await urianaChip.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    await urianaChip.click();

    try {
      await page.waitForFunction(() => {
        const target = document.getElementById('case-uriana');
        const avatar = document.querySelector('#comic-nav-logo [data-nav-avatar]');
        const trigger = document.getElementById('cockpit-trigger-btn');
        if (!target || !avatar || !trigger) return false;
        const navBottom = Math.max(
          avatar.getBoundingClientRect().bottom,
          trigger.getBoundingClientRect().bottom
        );
        const targetTop = target.getBoundingClientRect().top;
        return targetTop >= navBottom + 8 && targetTop <= navBottom + 80;
      }, null, { timeout: 4000 });
    } catch {
      // Fall through to metrics assertion for diagnostic message
    }

    const metrics = await page.evaluate(() => {
      const target = document.getElementById('case-uriana');
      const avatar = document.querySelector('#comic-nav-logo [data-nav-avatar]');
      const trigger = document.getElementById('cockpit-trigger-btn');
      const navBottom = Math.max(
        avatar ? avatar.getBoundingClientRect().bottom : 0,
        trigger ? trigger.getBoundingClientRect().bottom : 0
      );
      const targetTop = target ? target.getBoundingClientRect().top : 0;
      return { navBottom, targetTop, gap: targetTop - navBottom };
    });

    assert.ok(
      metrics.gap >= 8,
      `Expected #case-uriana top (${metrics.targetTop}px) to stop >= 8px below nav controls bottom (${metrics.navBottom}px), got gap=${metrics.gap}px`
    );
  } finally {
    await context.close();
  }
});

test('C15: scrolling past hero hides nameplate and keeps only avatar badge and menu button visible', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    assert.equal(await page.locator('[data-nav-nameplate]').isVisible(), true);

    await page.evaluate(() => {
      const works = document.getElementById('works');
      const y = works ? window.scrollY + works.getBoundingClientRect().top : 1200;
      window.scrollTo({ top: y, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(250);

    const state = await page.evaluate(() => {
      const avatar = document.querySelector('#comic-nav-logo [data-nav-avatar]');
      const nameplate = document.querySelector('[data-nav-nameplate]');
      const menuBtn = document.getElementById('cockpit-trigger-btn');
      const worksCta = document.querySelector('#comic-nav-header a[href="#works"]');
      const langBtn = document.getElementById('nav-lang-toggle-btn');

      const isVisible = (el) => {
        if (!el) return false;
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05;
      };

      return {
        avatarVisible: isVisible(avatar),
        menuVisible: isVisible(menuBtn),
        nameplateVisible: isVisible(nameplate),
        worksCtaVisible: isVisible(worksCta),
        langBtnVisible: isVisible(langBtn),
      };
    });

    assert.equal(state.avatarVisible, true, 'Avatar badge must stay visible past hero');
    assert.equal(state.menuVisible, true, 'Menu button must stay visible past hero');
    assert.equal(state.nameplateVisible, false, 'Nameplate must be hidden past hero');
    assert.equal(state.worksCtaVisible, false, 'Secondary works CTA must be hidden past hero');
    assert.equal(state.langBtnVisible, false, 'Secondary lang button must be hidden past hero');
  } finally {
    await context.close();
  }
});

test('C16: case cards and archive cards render through P5Panel with non-rectangular clip-path', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    const panels = await page.evaluate(() => {
      const parsePolygon = (clipPath) => {
        const match = clipPath.match(/polygon\((.+)\)/);
        if (!match) return null;
        return match[1].split(',').map((pt) => {
          const [x, y] = pt.trim().split(/\s+/).map((v) => Number.parseFloat(v));
          return { x, y };
        });
      };

      const isNonRectangular = (pts) => {
        if (!pts || pts.length < 4) return false;
        const isAxisAlignedRect =
          pts.length === 4 &&
          pts[0].x === 0 &&
          pts[0].y === 0 &&
          pts[1].x === 100 &&
          pts[1].y === 0 &&
          pts[2].x === 100 &&
          pts[2].y === 100 &&
          pts[3].x === 0 &&
          pts[3].y === 100;
        return !isAxisAlignedRect;
      };

      const caseCards = Array.from(document.querySelectorAll('#works [data-reel-card]'));
      const archiveCards = Array.from(document.querySelectorAll('#works [data-archive-card]'));

      return {
        caseCount: caseCards.length,
        archiveCount: archiveCards.length,
        cases: caseCards.map((el) => {
          const cp = window.getComputedStyle(el).clipPath;
          return {
            id: el.id,
            hasPanelAttr: el.hasAttribute('data-p5-panel'),
            clipPath: cp,
            nonRect: isNonRectangular(parsePolygon(cp)),
          };
        }),
        archives: archiveCards.map((el) => {
          const cp = window.getComputedStyle(el).clipPath;
          return {
            id: el.id,
            hasPanelAttr: el.hasAttribute('data-p5-panel'),
            clipPath: cp,
            nonRect: isNonRectangular(parsePolygon(cp)),
          };
        }),
      };
    });

    assert.equal(panels.caseCount, 4);
    assert.equal(panels.archiveCount, 8);
    for (const card of [...panels.cases, ...panels.archives]) {
      assert.equal(card.hasPanelAttr, true, `${card.id} must render through P5Panel`);
      assert.equal(
        card.nonRect,
        true,
        `${card.id} must have a non-rectangular polygon clip-path, got ${card.clipPath}`
      );
    }
  } finally {
    await context.close();
  }
});

test('C17: hovering or focusing a case link reveals the P5 selection polygon within 150ms', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    const firstLink = page.locator('#works a[data-case-link]').first();
    const secondLink = page.locator('#works a[data-case-link]').nth(1);
    await firstLink.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);

    const beforeHover = await firstLink.evaluate((el) => {
      const poly = el.querySelector('[data-p5-select-poly]');
      return poly ? Number(window.getComputedStyle(poly).opacity) : -1;
    });
    assert.equal(beforeHover, 0, 'Selection polygon must start at opacity 0 before hover/focus');

    await firstLink.hover();
    await page.waitForTimeout(130);

    const afterHover = await firstLink.evaluate((el) => {
      const poly = el.querySelector('[data-p5-select-poly]');
      const label = el.querySelector('[data-case-link-label]');
      if (!poly || !label) return null;
      const ps = window.getComputedStyle(poly);
      const ls = window.getComputedStyle(label);
      const rect = poly.getBoundingClientRect();
      return {
        opacity: Number(ps.opacity),
        clipPath: ps.clipPath,
        polyZ: Number(ps.zIndex) || 0,
        labelZ: Number(ls.zIndex) || 0,
        width: rect.width,
        height: rect.height,
      };
    });

    assert.ok(afterHover, 'Expected [data-p5-select-poly] and [data-case-link-label] inside case link');
    assert.ok(
      afterHover.opacity >= 0.9,
      `Selection polygon must appear within 150ms on hover, got opacity=${afterHover.opacity}`
    );
    assert.ok(afterHover.clipPath.startsWith('polygon('), `Expected polygon clip-path, got ${afterHover.clipPath}`);
    assert.ok(afterHover.labelZ > afterHover.polyZ, 'Selection polygon must render behind link label');
    assert.ok(afterHover.width > 20 && afterHover.height > 12);

    await secondLink.focus();
    await page.waitForTimeout(130);

    const afterFocus = await secondLink.evaluate((el) => {
      const poly = el.querySelector('[data-p5-select-poly]');
      return poly ? Number(window.getComputedStyle(poly).opacity) : 0;
    });
    assert.ok(
      afterFocus >= 0.9,
      `Selection polygon must appear within 150ms on keyboard focus, got opacity=${afterFocus}`
    );
  } finally {
    await context.close();
  }
});

test('C18: status and badge chips render through P5Badge', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    const badgeMetrics = await page.evaluate(() => {
      const caseBadges = Array.from(document.querySelectorAll('#works [data-case-badge]'));
      const archiveStatuses = Array.from(document.querySelectorAll('#works [data-archive-status]'));
      const all = [...caseBadges, ...archiveStatuses];
      return {
        caseBadgeCount: caseBadges.length,
        archiveStatusCount: archiveStatuses.length,
        allHaveP5Badge: all.every(
          (el) =>
            el.hasAttribute('data-p5-badge') &&
            window.getComputedStyle(el).clipPath.startsWith('polygon(')
        ),
      };
    });

    assert.equal(badgeMetrics.caseBadgeCount, 4);
    assert.ok(badgeMetrics.archiveStatusCount >= 1);
    assert.equal(badgeMetrics.allHaveP5Badge, true, 'All case badges and archive statuses must render via P5Badge');
  } finally {
    await context.close();
  }
});

test('C9: #works and #contact have computed background color rgb(251, 250, 244)', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    const bgColors = await page.evaluate(() => {
      const works = document.getElementById('works');
      const contact = document.getElementById('contact');
      return {
        works: works ? window.getComputedStyle(works).backgroundColor : null,
        contact: contact ? window.getComputedStyle(contact).backgroundColor : null,
      };
    });

    assert.equal(bgColors.works, 'rgb(251, 250, 244)');
    assert.equal(bgColors.contact, 'rgb(251, 250, 244)');
  } finally {
    await context.close();
  }
});

test('C10: every text node under 24px in #works and #contact has contrast ratio at least 4.5:1', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const violations = await page.evaluate(() => {
      const parseRgba = (str) => {
        const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/);
        if (!m) return null;
        return {
          r: Number(m[1]),
          g: Number(m[2]),
          b: Number(m[3]),
          a: m[4] === undefined ? 1 : Number(m[4]),
        };
      };

      const getEffectiveBg = (el) => {
        let cur = el;
        while (cur && cur instanceof Element) {
          const bg = parseRgba(window.getComputedStyle(cur).backgroundColor);
          if (bg && bg.a >= 0.95) return bg;
          cur = cur.parentElement;
        }
        return { r: 251, g: 250, b: 244, a: 1 };
      };

      const relLum = ({ r, g, b }) => {
        const ch = (v) => {
          const n = v / 255;
          return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
      };

      const contrast = (c1, c2) => {
        const l1 = relLum(c1);
        const l2 = relLum(c2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      };

      const bad = [];
      for (const rootSel of ['#works', '#contact']) {
        const root = document.querySelector(rootSel);
        if (!root) continue;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          const text = (node.nodeValue || '').trim();
          if (!text) continue;
          const el = node.parentElement;
          if (!el) continue;
          const cs = window.getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) {
            continue;
          }
          const fontSize = Number.parseFloat(cs.fontSize);
          if (fontSize >= 24) continue;
          const fg = parseRgba(cs.color);
          const bg = getEffectiveBg(el);
          if (!fg || !bg) continue;
          const ratio = contrast(fg, bg);
          if (ratio < 4.5) {
            bad.push({
              section: rootSel,
              text: text.slice(0, 40),
              fontSize,
              fg: cs.color,
              bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
              ratio: Number(ratio.toFixed(2)),
            });
          }
        }
      }
      return bad;
    });

    assert.deepEqual(
      violations,
      [],
      `Expected all <24px text in #works and #contact to have contrast >= 4.5:1, found violations: ${JSON.stringify(violations)}`
    );
  } finally {
    await context.close();
  }
});

test('C5: section h2 splits into letters with at least 3 font families and rotations between -8 and 8 deg', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    const bountyTitle = page.locator('#works [data-p5-title]').first();
    await bountyTitle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);

    const analysis = await bountyTitle.evaluate((el) => {
      const chars = Array.from(el.querySelectorAll('[data-p5-char]'));
      const families = new Set(chars.map((c) => window.getComputedStyle(c).fontFamily));
      const rotations = chars.map((c) => {
        const inlineRot = Number.parseFloat(c.getAttribute('data-p5-rot') || '0');
        const tr = window.getComputedStyle(c).transform;
        let computedDeg = inlineRot;
        const m = tr.match(/matrix\(([^)]+)\)/);
        if (m) {
          const [a, b] = m[1].split(',').map((v) => Number.parseFloat(v.trim()));
          computedDeg = Math.atan2(b, a) * (180 / Math.PI);
        }
        return {
          char: c.textContent,
          inlineRot,
          computedDeg: Number(computedDeg.toFixed(2)),
        };
      });
      return {
        revealed: el.getAttribute('data-p5-revealed'),
        charCount: chars.length,
        familyCount: families.size,
        rotations,
      };
    });

    assert.equal(analysis.revealed, 'true');
    assert.ok(analysis.charCount >= 10, `Expected split characters, got ${analysis.charCount}`);
    assert.ok(
      analysis.familyCount >= 3,
      `Expected at least 3 computed font-family values across letters, got ${analysis.familyCount}`
    );
    for (const r of analysis.rotations) {
      assert.ok(
        r.inlineRot >= -8 && r.inlineRot <= 8 && r.inlineRot !== 0,
        `Expected data-p5-rot in [-8, 8] for "${r.char}", got ${r.inlineRot}`
      );
      assert.ok(
        r.computedDeg >= -8.5 && r.computedDeg <= 8.5 && Math.abs(r.computedDeg) >= 0.5,
        `Expected computed transform rotation in [-8, 8] for "${r.char}", got ${r.computedDeg}`
      );
    }
  } finally {
    await context.close();
  }
});

test('C6: P5Title exposes full title via aria-label and hides individual letters from assistive tech', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    const titles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-p5-title]')).map((el) => {
        const chars = Array.from(el.querySelectorAll('[data-p5-char]'));
        const words = Array.from(el.querySelectorAll('[data-p5-word]'));
        return {
          ariaLabel: el.getAttribute('aria-label'),
          textContent: (el.textContent || '').trim(),
          charCount: chars.length,
          allCharsHidden: chars.every((c) => c.getAttribute('aria-hidden') === 'true'),
          allWordsHidden: words.every((w) => w.getAttribute('aria-hidden') === 'true'),
        };
      });
    });

    assert.ok(titles.length >= 5, `Expected at least 5 section P5Title headings, got ${titles.length}`);
    for (const t of titles) {
      assert.ok(t.ariaLabel && t.ariaLabel.length > 0, 'P5Title must have non-empty aria-label');
      assert.equal(t.ariaLabel, t.textContent, 'aria-label must match full reconstructed title text');
      assert.ok(t.charCount > 0, 'P5Title must contain split letter elements');
      assert.equal(t.allCharsHidden, true, 'Every [data-p5-char] must have aria-hidden="true"');
      assert.equal(t.allWordsHidden, true, 'Every [data-p5-word] must have aria-hidden="true"');
    }
  } finally {
    await context.close();
  }
});

test('C7: P5Title renders static ransom-note state immediately when reduced motion is active', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const state = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-p5-title]')).map((el) => {
        const chars = Array.from(el.querySelectorAll('[data-p5-char]'));
        return {
          animated: el.getAttribute('data-p5-animated'),
          revealed: el.getAttribute('data-p5-revealed'),
          allRotatedStatic: chars.every((c) => {
            const tr = c.style.transform || '';
            return tr.startsWith('rotate(') && tr !== 'rotate(0deg)';
          }),
        };
      });
    });

    assert.ok(state.length >= 5);
    for (const item of state) {
      assert.equal(item.animated, 'false', 'P5Title must skip entrance animation under prefers-reduced-motion');
      assert.equal(item.revealed, 'true', 'P5Title must immediately be in revealed state under prefers-reduced-motion');
      assert.equal(item.allRotatedStatic, true, 'All letters must immediately have their static ransom rotation');
    }
  } finally {
    await context.close();
  }
});

test('C8: P5Title rebuilds letters and aria-label when locale changes', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const before = await page.evaluate(() => {
      const contactTitle = document.querySelector('#contact [data-p5-title]');
      if (!contactTitle) return null;
      const chars = Array.from(contactTitle.querySelectorAll('[data-p5-char]'))
        .map((c) => c.textContent)
        .join('');
      return {
        ariaLabel: contactTitle.getAttribute('aria-label'),
        chars,
      };
    });

    assert.ok(before);
    assert.equal(before.ariaLabel, 'VAMOS CONVERSAR');
    assert.equal(before.chars, 'VAMOSCONVERSAR');

    await page.click('#nav-lang-toggle-btn');

    const after = await page.evaluate(() => {
      const contactTitle = document.querySelector('#contact [data-p5-title]');
      if (!contactTitle) return null;
      const chars = Array.from(contactTitle.querySelectorAll('[data-p5-char]'))
        .map((c) => c.textContent)
        .join('');
      return {
        ariaLabel: contactTitle.getAttribute('aria-label'),
        chars,
      };
    });

    assert.ok(after);
    assert.notEqual(after.ariaLabel, before.ariaLabel);
    assert.equal(after.chars, after.ariaLabel.replace(/\s+/g, ''));
  } finally {
    await context.close();
  }
});

test('C11: consecutive sections with different background colors render a non-horizontal diagonal cut', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    const cuts = await page.evaluate(() => {
      const parsePolygon = (clipPath) => {
        const m = clipPath.match(/polygon\((.+)\)/);
        if (!m) return null;
        return m[1].split(',').map((pt) => {
          const [x, y] = pt.trim().split(/\s+/).map((v) => Number.parseFloat(v));
          return { x, y };
        });
      };

      const sections = Array.from(
        document.querySelectorAll('#main-content > section, footer[data-bebop-footer]')
      );
      const transitions = [];

      for (let i = 1; i < sections.length; i += 1) {
        const prev = sections[i - 1];
        const curr = sections[i];
        const prevBg = window.getComputedStyle(prev).backgroundColor;
        const currBg = window.getComputedStyle(curr).backgroundColor;
        if (prevBg === currBg) continue;

        const cutEl = curr.querySelector('[data-p5-section-cut]');
        if (!cutEl) {
          transitions.push({
            from: prev.id || prev.tagName,
            to: curr.id || curr.tagName,
            hasCut: false,
            isDiagonal: false,
            height: 0,
          });
          continue;
        }
        const cs = window.getComputedStyle(cutEl);
        const pts = parsePolygon(cs.clipPath);
        const rect = cutEl.getBoundingClientRect();
        const isDiagonal = Boolean(
          pts && pts.length >= 3 && pts[0].y !== pts[1].y
        );
        transitions.push({
          from: prev.id || prev.tagName,
          to: curr.id || curr.tagName,
          hasCut: true,
          clipPath: cs.clipPath,
          isDiagonal,
          height: rect.height,
        });
      }
      return transitions;
    });

    assert.ok(cuts.length >= 4, `Expected at least 4 color-changing section boundaries, got ${cuts.length}`);
    for (const t of cuts) {
      assert.equal(t.hasCut, true, `Missing [data-p5-section-cut] between ${t.from} and ${t.to}`);
      assert.equal(
        t.isDiagonal,
        true,
        `Cut between ${t.from} and ${t.to} must have a non-horizontal diagonal polygon edge, got ${t.clipPath}`
      );
      assert.ok(t.height >= 20, `Cut between ${t.from} and ${t.to} must have visible height >= 20px, got ${t.height}`);
    }
  } finally {
    await context.close();
  }
});

test('C13: zero horizontal overflow at 320, 375, 768 and 1440px in pt-br and en', async () => {
  const widths = [320, 375, 768, 1440];
  const locales = ['pt-br', 'en'];
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();

  try {
    for (const locale of locales) {
      await page.addInitScript((loc) => {
        window.localStorage.setItem('brinu_locale', loc);
      }, locale);

      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));

        assert.ok(
          metrics.scrollWidth <= metrics.clientWidth,
          `Overflow at ${width}px (${locale}): scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}`
        );
      }
    }
  } finally {
    await context.close();
  }
});

test('C21: with JavaScript disabled section titles render as plain readable text', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    const titles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-p5-title]')).map((el) => ({
        text: (el.textContent || '').trim(),
        childElementCount: el.childElementCount,
        visible: window.getComputedStyle(el).visibility !== 'hidden' && Number(window.getComputedStyle(el).opacity) > 0,
      }));
    });

    assert.ok(titles.length >= 5);
    for (const t of titles) {
      assert.ok(t.text.length >= 3, 'Title text must be non-empty when JS is disabled');
      assert.equal(t.childElementCount, 0, 'With JS disabled, title must render as plain text without split spans');
      assert.equal(t.visible, true, 'Title must be visible when JS is disabled');
    }
  } finally {
    await context.close();
  }
});



