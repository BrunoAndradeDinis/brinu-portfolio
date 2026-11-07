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
    const urianaChip = page.locator('a[href="#case-uriana"]').first();
    await urianaChip.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    await urianaChip.click();

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


