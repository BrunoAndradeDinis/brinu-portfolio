const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

async function testStory32() {
  console.log('=== TESTES PLAYWRIGHT: STORY 3.2 — INTEGRAÇÃO DOS DADOS REAIS DOS 4 CASES ===\n');

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    console.log('[1/4] Carregando a página no Desktop (1440x900)...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(500);

    // 2. CHECK THE 4 CANONICAL CASES
    console.log('\n[2/4] Validando conteúdo canônico dos 4 cases autorais...');
    const casesData = await page.evaluate(() => {
      const caseIds = ['aurastream', 'quake-log-parser', 'jokenpo-franky', 'the-warriors'];
      return caseIds.map((id) => {
        const card = document.getElementById(`case-${id}`);
        if (!card) return { id, exists: false };

        const title = card.querySelector('h3')?.innerText.trim() || '';
        const subtitle = card.querySelector('p.font-mono')?.innerText.trim() || '';
        const challenge = card.innerText.includes('DESAFIO TÉCNICO:');
        const solution = card.innerText.includes('SOLUÇÃO ARQUITETURAL:');
        const metric = card.innerText.includes('METRIC //');
        
        const stackBadges = Array.from(card.querySelectorAll('span.rounded.border')).map(s => s.innerText.trim());
        const links = Array.from(card.querySelectorAll('a')).map(a => ({
          text: a.innerText.trim(),
          href: a.getAttribute('href'),
          target: a.getAttribute('target'),
          rel: a.getAttribute('rel'),
          ariaLabel: a.getAttribute('aria-label'),
        }));

        return {
          id,
          exists: true,
          title,
          subtitle,
          challenge,
          solution,
          metric,
          stackCount: stackBadges.length,
          links,
        };
      });
    });

    for (const c of casesData) {
      assert(c.exists, `Card #case-${c.id} deve existir na página`);
      assert(c.title.length > 0, `Título do case ${c.id} não pode estar vazio`);
      assert(c.challenge, `Case ${c.id} deve conter bloco de DESAFIO TÉCNICO`);
      assert(c.solution, `Case ${c.id} deve conter bloco de SOLUÇÃO ARQUITETURAL`);
      assert(c.metric, `Case ${c.id} deve conter indicador de METRIC`);
      assert(c.stackCount > 0, `Case ${c.id} deve conter badges de stack (obtido: ${c.stackCount})`);
      assert(c.links.length > 0, `Case ${c.id} deve conter ao menos 1 link de ação`);

      for (const link of c.links) {
        assert.strictEqual(link.target, '_blank', `Link "${link.text}" de ${c.id} deve ter target="_blank"`);
        assert(link.rel && link.rel.includes('noopener') && link.rel.includes('noreferrer'), `Link "${link.text}" deve ter rel="noopener noreferrer"`);
        assert(link.ariaLabel && link.ariaLabel.length > 10, `Link "${link.text}" deve ter aria-label descritivo`);
      }

      console.log(`  ✓ Case: [${c.id}] -> "${c.title}"`);
      console.log(`    Stack: ${c.stackCount} itens | Links: ${c.links.map(l => l.text).join(', ')}`);
    }

    // 3. CAPTURE WORKS SECTION SCREENSHOT
    console.log('\n[3/4] Capturando screenshot da seção Selected Works...');
    const worksSection = page.locator('#works');
    await worksSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const artifactDir = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';
    const screenshotPath = path.join(artifactDir, '01_selected_works_4_cases.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`✓ Screenshot salvo em: ${screenshotPath}`);

    // 4. RESPONSIVENESS AND NO OVERFLOW ACROSS ALL BREAKPOINTS
    console.log('\n[4/4] Validando ausência de overflow horizontal em múltiplos viewports...');
    const breakpoints = [
      { name: 'Mobile Mini', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1440, height: 900 },
      { name: 'Ultrawide', width: 2560, height: 1440 },
    ];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(300);

      const overflow = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        return { docW, winW, hasOverflow: docW > winW };
      });

      assert(!overflow.hasOverflow, `Overflow detectado em ${bp.name}: docW=${overflow.docW}, winW=${overflow.winW}`);
      console.log(`  ✓ ${bp.name} (${bp.width}px): scrollWidth=${overflow.docW}px <= clientWidth=${overflow.winW}px`);
    }

    console.log('\n=============================================================');
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 3.2 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } finally {
    await browser.close();
  }
}

testStory32().catch((err) => {
  console.error('\n❌ ERRO NOS TESTES DA HISTÓRIA 3.2:');
  console.error(err);
  process.exit(1);
});
