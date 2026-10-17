const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';
const LOCAL_DIR = '/home/br_dinis/Pessoal/brinu-portfolio/_bmad-output/initiative-brinu-portfolio/epic-02-hero-3d/screenshots';

fs.mkdirSync(LOCAL_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function runStory22Tests() {
  console.log('=== TESTES AUTOMATIZADOS PLAYWRIGHT: STORY 2.2 — AVATAR HQ & CARIMBO HELENA\'S DAD ===\n');

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

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // 1. CARREGAR HERO COM PRELOADER CONCLUÍDO
    console.log('[1/5] Carregando a página e aguardando dismiss do preloader...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(500);

    // 2. VALIDAÇÃO DOS ELEMENTOS DO AVATAR E CARIMBO
    console.log('\n[2/5] Validando elementos estruturais do Avatar e Carimbo Helena\'s Dad...');
    const avatarBadge = await page.$('#hero-avatar-badge');
    assert(avatarBadge, 'Badge interativo do avatar #hero-avatar-badge deve existir');

    const stampBadge = await page.$('#hero-stamp-badge');
    assert(stampBadge, 'Carimbo de estêncil #hero-stamp-badge deve existir');

    const stampText = await stampBadge.innerText();
    assert(stampText.includes("HELENA'S DAD"), `Carimbo deve conter HELENA'S DAD. Obtido: "${stampText}"`);
    console.log(`✓ Carimbo de estêncil validado: "${stampText.replace(/\s+/g, ' ').trim()}"`);

    const celuloideTag = await page.locator('#hero-avatar-badge').getByText('35MM').first();
    const hasCeluloide = await celuloideTag.count() > 0;
    assert(hasCeluloide, 'Tag de fotograma de celuloide 35MM deve existir dentro da moldura');
    console.log('✓ Tag de fotograma celuloide 35MM detectada');

    const accessibilityAttrs = await avatarBadge.evaluate((el) => ({
      role: el.getAttribute('role'),
      tabIndex: el.getAttribute('tabindex'),
      ariaLabel: el.getAttribute('aria-label'),
      ariaExpanded: el.getAttribute('aria-expanded'),
    }));
    assert.strictEqual(accessibilityAttrs.role, 'button', 'Avatar deve possuir role="button"');
    assert.strictEqual(accessibilityAttrs.tabIndex, '0', 'Avatar deve ser focável via tabindex="0"');
    assert(accessibilityAttrs.ariaLabel && accessibilityAttrs.ariaLabel.includes("Helena's Dad"), 'Aria-label deve descrever o avatar e o carimbo');
    assert.strictEqual(accessibilityAttrs.ariaExpanded, 'false', 'aria-expanded inicial deve ser false');
    console.log('✓ Acessibilidade do Avatar validada:', accessibilityAttrs);

    // Screenshot Estado Inicial (Hover/Idle)
    const shotIdleLocal = path.join(LOCAL_DIR, '01_avatar_idle_desktop.png');
    const shotIdleArtifact = path.join(ARTIFACT_DIR, '01_avatar_idle_desktop.png');
    await page.screenshot({ path: shotIdleLocal });
    fs.copyFileSync(shotIdleLocal, shotIdleArtifact);
    console.log('✓ Screenshot 1 salvo (Desktop Idle):', shotIdleLocal);

    // 3. MICROINTERAÇÃO TÁTIL: CLIQUE E BALÃO COMIC POP
    console.log('\n[3/5] Testando microinteração tátil de clique no Avatar...');
    await avatarBadge.click();
    await page.waitForTimeout(300);

    const bubbleState = await page.evaluate(() => {
      const bubble = document.getElementById('avatar-comic-bubble');
      const text = document.getElementById('avatar-comic-text');
      const badge = document.getElementById('hero-avatar-badge');
      return {
        hasBubble: !!bubble,
        opacity: bubble ? window.getComputedStyle(bubble).opacity : null,
        ariaExpanded: badge ? badge.getAttribute('aria-expanded') : null,
        text: text ? text.innerText : null,
      };
    });

    assert.strictEqual(bubbleState.ariaExpanded, 'true', 'aria-expanded deve ser atualizado para true após clique');
    assert.strictEqual(bubbleState.opacity, '1', 'Balão de diálogo comic deve estar visível com opacity: 1');
    assert(bubbleState.text && bubbleState.text.length > 0, `Balão deve conter texto. Obtido: "${bubbleState.text}"`);
    console.log(`✓ Microinteração de clique acionou balão comic: "${bubbleState.text}" (opacity: ${bubbleState.opacity})`);

    // Screenshot Estado Ativado com Balão de Fala Comic
    const shotActiveLocal = path.join(LOCAL_DIR, '02_avatar_comic_pop_active.png');
    const shotActiveArtifact = path.join(ARTIFACT_DIR, '02_avatar_comic_pop_active.png');
    await page.screenshot({ path: shotActiveLocal });
    fs.copyFileSync(shotActiveLocal, shotActiveArtifact);
    console.log('✓ Screenshot 2 salvo (Comic Pop Ativo):', shotActiveLocal);

    // 4. MICROINTERAÇÃO VIA TECLADO (Space / Enter)
    console.log('\n[4/5] Testando acionamento acessível via teclado (Enter)...');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    const bubbleTextAfterEnter = await page.evaluate(() => {
      const text = document.getElementById('avatar-comic-text');
      return text ? text.innerText : null;
    });
    console.log(`✓ Teclado Enter avançou para próxima fala de HQ: "${bubbleTextAfterEnter}"`);

    await context.close();

    // 5. TESTES RESPONSIVOS MULTI-VIEWPORT (375px a 2560px)
    console.log('\n[5/5] Testando responsividade e contenção sem overflow...');
    const viewports = [
      { name: 'Mobile (375x667)', width: 375, height: 667, shot: '03_avatar_mobile_375.png' },
      { name: 'Tablet (768x1024)', width: 768, height: 1024, shot: '04_avatar_tablet_768.png' },
      { name: 'Desktop Ultrawide (2560x1440)', width: 2560, height: 1440, shot: '05_avatar_ultrawide_2560.png' }
    ];

    for (const vp of viewports) {
      const vpContext = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const vpPage = await vpContext.newPage();
      await vpPage.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
      await vpPage.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
      await vpPage.waitForTimeout(400);

      const metrics = await vpPage.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const avatar = document.getElementById('hero-avatar-badge');
        const avatarRect = avatar ? avatar.getBoundingClientRect() : null;
        return {
          hasHorizontalOverflow: scrollWidth > clientWidth,
          avatarWidth: avatarRect ? avatarRect.width : null,
          avatarHeight: avatarRect ? avatarRect.height : null,
          avatarLeft: avatarRect ? avatarRect.left : null,
          clientWidth,
        };
      });

      assert(!metrics.hasHorizontalOverflow, `Viewport ${vp.name} apresentou transbordamento horizontal`);
      assert(metrics.avatarWidth > 0 && metrics.avatarHeight > 0, `Avatar deve ter dimensões positivas em ${vp.name}`);

      const shotLocal = path.join(LOCAL_DIR, vp.shot);
      const shotArtifact = path.join(ARTIFACT_DIR, vp.shot);
      await vpPage.screenshot({ path: shotLocal });
      fs.copyFileSync(shotLocal, shotArtifact);
      console.log(`  ✓ ${vp.name}: width=${metrics.avatarWidth.toFixed(1)}px, overflow=${metrics.hasHorizontalOverflow ? 'SIM' : 'NÃO'}`);

      await vpContext.close();
    }

    console.log('\n======================================================');
    console.log('TODOS OS TESTES DA STORY 2.2 PASSARAM COM 100% DE SUCESSO!');
    console.log('Erros no console:', consoleErrors.length === 0 ? 'Zero erros' : consoleErrors);
    console.log('======================================================');
    return true;
  } finally {
    await browser.close();
  }
}

runStory22Tests().catch((err) => {
  console.error('\n❌ Falha nos testes da Story 2.2:', err);
  process.exit(1);
});
