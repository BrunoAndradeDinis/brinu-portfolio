const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

async function testStory41() {
  console.log('=== TESTES PLAYWRIGHT: STORY 4.1 — SEÇÃO ABOUT & AVATAR EM QUADRINHOS ===\n');

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

    console.log('[1/4] Carregando a aplicação no Desktop (1440x900)...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(500);

    // 2. SCROLL TO #ABOUT AND VALIDATE STRUCTURE
    console.log('\n[2/4] Validando estrutura do Dossiê do Autor (#about) e imagem do avatar...');
    const aboutSection = page.locator('#about');
    await aboutSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const aboutData = await page.evaluate(() => {
      const about = document.getElementById('about');
      const title = about ? about.querySelector('[data-about-title]') : null;
      const avatarImg = document.getElementById('about-official-avatar');
      const avatarPanel = about ? about.querySelector('[data-about-avatar-panel]') : null;
      const contentPanel = about ? about.querySelector('[data-about-content-panel]') : null;

      return {
        hasAbout: !!about,
        ariaLabel: about ? about.getAttribute('aria-label') : null,
        titleText: title ? title.innerText.trim() : null,
        hasAvatarImg: !!avatarImg,
        avatarSrc: avatarImg ? avatarImg.getAttribute('src') : null,
        avatarAlt: avatarImg ? avatarImg.getAttribute('alt') : null,
        avatarNaturalWidth: avatarImg ? avatarImg.naturalWidth : 0,
        avatarNaturalHeight: avatarImg ? avatarImg.naturalHeight : 0,
        avatarWidthAttr: avatarImg ? avatarImg.getAttribute('width') : null,
        avatarHeightAttr: avatarImg ? avatarImg.getAttribute('height') : null,
        hasAvatarPanel: !!avatarPanel,
        hasContentPanel: !!contentPanel,
      };
    });

    assert(aboutData.hasAbout, 'Seção #about deve existir');
    assert(aboutData.ariaLabel && aboutData.ariaLabel.includes('Dossiê do Autor'), 'Seção deve conter aria-label descritivo');
    assert(aboutData.titleText && aboutData.titleText.includes('DOSSIER: BRINU'), `Título deve conter "DOSSIER: BRINU" (obtido: ${aboutData.titleText})`);
    
    assert(aboutData.hasAvatarImg, 'Elemento #about-official-avatar deve existir');
    assert(aboutData.avatarSrc && aboutData.avatarSrc.includes('brinu-avatar.jpg'), `Avatar deve carregar brinu-avatar.jpg (obtido: ${aboutData.avatarSrc})`);
    assert(aboutData.avatarNaturalWidth > 0 && aboutData.avatarNaturalHeight > 0, `Avatar deve ser uma imagem válida e carregada (dimensões naturais: ${aboutData.avatarNaturalWidth}x${aboutData.avatarNaturalHeight})`);
    assert(aboutData.avatarWidthAttr && aboutData.avatarHeightAttr, 'Avatar deve possuir atributos width e height explícitos para prevenção de CLS');
    assert(aboutData.avatarAlt && aboutData.avatarAlt.length > 10, 'Avatar deve possuir alt text descritivo');

    console.log(`✓ Seção #about detectada: "${aboutData.titleText}"`);
    console.log(`✓ Imagem oficial validada: ${aboutData.avatarSrc} (${aboutData.avatarNaturalWidth}x${aboutData.avatarNaturalHeight})`);
    console.log(`✓ Atributos de prevenção de CLS presentes: width=${aboutData.avatarWidthAttr}, height=${aboutData.avatarHeightAttr}`);

    // 3. CAPTURE ABOUT SECTION SCREENSHOT
    console.log('\n[3/4] Capturando screenshot da seção About...');
    const artifactDir = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';
    const screenshotPath = path.join(artifactDir, '01_about_operator_dossier.png');
    await aboutSection.screenshot({ path: screenshotPath });
    console.log(`✓ Screenshot salvo em: ${screenshotPath}`);

    // 4. RESPONSIVENESS AND ZERO OVERFLOW ACROSS BREAKPOINTS
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
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 4.1 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } finally {
    await browser.close();
  }
}

testStory41().catch((err) => {
  console.error('\n❌ ERRO NOS TESTES DA HISTÓRIA 4.1:');
  console.error(err);
  process.exit(1);
});
