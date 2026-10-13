const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4321/ ...');
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

  // Wait for preloader to dismiss
  await page.waitForTimeout(3500);

  // Take screenshot desktop
  await page.screenshot({ path: 'scripts/desktop_1440.png', fullPage: false });
  console.log('Saved scripts/desktop_1440.png');

  // Diagnostics Desktop
  const diagnostics = await page.evaluate(() => {
    const nav = document.querySelector('header');
    const ticker = document.querySelector('header + div, [aria-hidden="true"]');
    const hero = document.querySelector('#hero');
    const h1 = document.querySelector('h1[aria-label="BRINU"]');
    const avatar = document.querySelector('#hero img')?.parentElement?.parentElement;
    const leftText = document.querySelector('#hero p:first-of-type');
    const rightText = document.querySelector('#hero .flex-col.items-start p, #hero .flex-col.sm\\:items-end p');
    const worksSection = document.querySelector('#works');

    const getMetrics = (el, name) => {
      if (!el) return { name, exists: false };
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        name,
        exists: true,
        rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height },
        computed: {
          height: style.height,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          marginTop: style.marginTop,
          marginBottom: style.marginBottom,
        }
      };
    };

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      nav: getMetrics(nav, 'ComicNav (header)'),
      ticker: getMetrics(ticker, 'Ticker Tape'),
      hero: getMetrics(hero, 'Hero Section'),
      h1: getMetrics(h1, 'Colossal BRINU'),
      avatar: getMetrics(avatar, 'Avatar Container'),
      leftText: getMetrics(leftText, 'Corner Left Text'),
      rightText: getMetrics(rightText, 'Corner Right Text'),
      worksSection: getMetrics(worksSection, 'Works Section'),
    };
  });

  console.log('Desktop Diagnostics:', JSON.stringify(diagnostics, null, 2));

  // Mobile Diagnostics
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/mobile_375.png', fullPage: false });
  console.log('Saved scripts/mobile_375.png');

  const mobileDiagnostics = await page.evaluate(() => {
    const nav = document.querySelector('header');
    const ticker = document.querySelector('header + div');
    const hero = document.querySelector('#hero');
    const h1 = document.querySelector('h1[aria-label="BRINU"]');
    const avatar = document.querySelector('#hero img')?.parentElement?.parentElement;
    const selectedWorksBtn = document.querySelector('header nav a');
    const brandText = document.querySelector('header span');

    const getMetrics = (el, name) => {
      if (!el) return { name, exists: false };
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        name,
        exists: true,
        rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height },
        fontSize: style.fontSize,
      };
    };

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      nav: getMetrics(nav, 'ComicNav'),
      brandText: getMetrics(brandText, 'Brand Text'),
      selectedWorksBtn: getMetrics(selectedWorksBtn, 'Selected Works Button'),
      ticker: getMetrics(ticker, 'Ticker Tape'),
      hero: getMetrics(hero, 'Hero Section'),
      h1: getMetrics(h1, 'Colossal BRINU'),
      avatar: getMetrics(avatar, 'Avatar Container'),
    };
  });

  console.log('Mobile Diagnostics:', JSON.stringify(mobileDiagnostics, null, 2));

  await browser.close();
}

run().catch(console.error);
