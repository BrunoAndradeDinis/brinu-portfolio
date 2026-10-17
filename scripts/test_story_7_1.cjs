const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';

async function testStory71() {
  console.log('=== TESTES PLAYWRIGHT: STORY 7.1 — SEÇÃO CONTACT E BOTÃO MAGNÉTICO ===\n');

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

    // 2. SCROLL TO #CONTACT AND VALIDATE
    console.log('\n[2/4] Validando montagem da seção Contact e cabeçalho editorial...');
    const contactSection = page.locator('#contact');
    await contactSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const contactTitle = page.locator('[data-contact-title]');
    await contactTitle.waitFor({ state: 'visible', timeout: 5000 });
    const titleText = await contactTitle.innerText();
    assert(titleText.includes('TRANSMIT A BOUNTY'), `Título deve conter TRANSMIT A BOUNTY (obtido: ${titleText})`);
    console.log('✓ Seção #contact renderizada com tipografia monumental');

    // 3. VALIDATE PRIMARY MAILTO CTA BUTTON
    console.log('\n[3/4] Validando botão primário magnético de mailto pré-formatado...');
    const mailtoBtn = page.locator('[data-primary-contact-btn]');
    await mailtoBtn.waitFor({ state: 'visible', timeout: 3000 });

    const mailtoHref = await mailtoBtn.getAttribute('href');
    assert(
      mailtoHref &&
        mailtoHref.startsWith('mailto:bruno.a.dinis96@gmail.com') &&
        mailtoHref.includes('Bounty%20Contract'),
      `Botão de e-mail deve apontar para bruno.a.dinis96@gmail.com com assunto pré-configurado (obtido: ${mailtoHref})`
    );
    console.log('✓ Link mailto verificado com destinatário e assunto de proposta corretos');

    // Capturar screenshot da seção Contact
    const screenshotPath = path.join(ARTIFACT_DIR, '01_contact_section_screen.png');
    await contactSection.screenshot({ path: screenshotPath });
    console.log(`✓ Screenshot salvo em: ${screenshotPath}`);

    // 4. VALIDATE RESPONSIVE CONTAINMENT & ZERO OVERFLOW
    console.log('\n[4/4] Validando contenção responsiva e ausência de overflow horizontal...');
    const viewports = [
      { name: 'Mobile Mini (375px)', width: 375, height: 667 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Desktop (1440px)', width: 1440, height: 900 },
      { name: 'Ultrawide (2560px)', width: 2560, height: 1440 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.locator('#contact').scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      assert(
        !hasHorizontalScroll,
        `Overflow horizontal detectado em ${vp.name}: scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}`
      );
      console.log(`  ✓ ${vp.name}: scrollWidth=${metrics.scrollWidth}px <= clientWidth=${metrics.clientWidth}px`);
    }

    console.log('\n=============================================================');
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 7.1 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('❌ Erro durante o teste da História 7.1:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory71();
