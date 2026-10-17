const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';
const LOCAL_DIR = '/home/br_dinis/Pessoal/brinu-portfolio/_bmad-output/initiative-brinu-portfolio/walkthrough-motion-nav/screenshots';

fs.mkdirSync(LOCAL_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function runVisualValidation() {
  console.log('=== INICIANDO VALIDAÇÃO VISUAL PLAYWRIGHT: WALKTHROUGH MOTION & NAV ===\n');

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
  });

  try {
    // 1. DESKTOP CONTEXT
    const contextDesktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await contextDesktop.newPage();

    // Capturar logs do console para garantir zero erros
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // CENÁRIO 1: Preloader Ativo (?freeze)
    console.log('[1/4] Capturando Cortina do Preloader (modo ?freeze)...');
    await page.goto('http://localhost:4321/?freeze', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(600); // estabilização das scanlines/fontes

    const shot1Local = path.join(LOCAL_DIR, '01_preloader_curtain.png');
    const shot1Artifact = path.join(ARTIFACT_DIR, '01_preloader_curtain.png');
    await page.screenshot({ path: shot1Local });
    fs.copyFileSync(shot1Local, shot1Artifact);
    console.log('✓ Screenshot 1 salvo:', shot1Local);

    // CENÁRIO 2: Revelação da Hero e ComicNav Persistente
    console.log('\n[2/4] Capturando Hero + ComicNav após conclusão do reveal...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    
    // Aguarda dismiss da cortina
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(500);

    const shot2Local = path.join(LOCAL_DIR, '02_revealed_hero_comicnav.png');
    const shot2Artifact = path.join(ARTIFACT_DIR, '02_revealed_hero_comicnav.png');
    await page.screenshot({ path: shot2Local });
    fs.copyFileSync(shot2Local, shot2Artifact);
    console.log('✓ Screenshot 2 salvo:', shot2Local);

    // Métricas da ComicNav pós-reveal
    const navMetrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const rect = header ? header.getBoundingClientRect() : null;
      const htmlClass = document.documentElement.className;
      return {
        headerExists: !!header,
        headerHeight: rect ? rect.height : null,
        headerTop: rect ? rect.top : null,
        htmlClass,
        scrollY: window.scrollY,
      };
    });
    console.log('  Métricas da navegação:', navMetrics);

    // CENÁRIO 3: Rolagem Suave Lenis até #works
    console.log('\n[3/4] Acionando clique na âncora #works e capturando estado scrolled...');
    const worksLink = await page.$('a[href="#works"]');
    if (worksLink) {
      await worksLink.click();
    } else {
      await page.evaluate(() => window.location.hash = '#works');
    }

    // Aguarda interpolação do Lenis
    await page.waitForTimeout(1600);

    const shot3Local = path.join(LOCAL_DIR, '03_scrolled_works_storyboard.png');
    const shot3Artifact = path.join(ARTIFACT_DIR, '03_scrolled_works_storyboard.png');
    await page.screenshot({ path: shot3Local });
    fs.copyFileSync(shot3Local, shot3Artifact);
    console.log('✓ Screenshot 3 salvo:', shot3Local);

    const scrollMetrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const headerRect = header ? header.getBoundingClientRect() : null;
      const works = document.querySelector('#works');
      const worksRect = works ? works.getBoundingClientRect() : null;
      return {
        scrollY: window.scrollY,
        headerTop: headerRect ? headerRect.top : null,
        worksTop: worksRect ? worksRect.top : null,
      };
    });
    console.log('  Métricas de scroll pós-âncora:', scrollMetrics);

    await contextDesktop.close();

    // 2. MOBILE CONTEXT (375x667)
    console.log('\n[4/4] Capturando renderização Mobile (375x667 iPhone SE)...');
    const contextMobile = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
    });
    const pageMobile = await contextMobile.newPage();
    await pageMobile.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    
    // Aguarda dismiss
    await pageMobile.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await pageMobile.waitForTimeout(400);

    const shot4Local = path.join(LOCAL_DIR, '04_mobile_375x667.png');
    const shot4Artifact = path.join(ARTIFACT_DIR, '04_mobile_375x667.png');
    await pageMobile.screenshot({ path: shot4Local });
    fs.copyFileSync(shot4Local, shot4Artifact);
    console.log('✓ Screenshot 4 salvo:', shot4Local);

    const mobileMetrics = await pageMobile.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const header = document.querySelector('header');
      const headerRect = header ? header.getBoundingClientRect() : null;
      return {
        hasHorizontalOverflow: scrollWidth > clientWidth,
        headerHeight: headerRect ? headerRect.height : null,
      };
    });
    console.log('  Métricas mobile:', mobileMetrics);

    await contextMobile.close();

    console.log('\n======================================================');
    console.log('VALIDAÇÃO VISUAL PLAYWRIGHT CONCLUÍDA COM SUCESSO!');
    console.log('Erros no console:', consoleErrors.length === 0 ? 'Nenhum erro' : consoleErrors);
    console.log('======================================================');

    return {
      success: true,
      screenshots: [shot1Local, shot2Local, shot3Local, shot4Local],
      navMetrics,
      scrollMetrics,
      mobileMetrics,
      consoleErrors,
    };
  } finally {
    await browser.close();
  }
}

runVisualValidation().catch((err) => {
  console.error('Erro na validação visual:', err);
  process.exit(1);
});
