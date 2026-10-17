const { chromium } = require('playwright');
const assert = require('assert');

async function testStory51() {
  console.log('=== TESTES PLAYWRIGHT: STORY 5.1 — MOTOR DE SÍNTESE SONORA (WEB AUDIO API) ===\n');

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
  });

  const audioRequests = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // 1. Interceptar requisições para garantir zero arquivos externos de áudio (AD-4)
    page.on('request', (req) => {
      const url = req.url().toLowerCase();
      if (
        url.endsWith('.mp3') ||
        url.endsWith('.wav') ||
        url.endsWith('.ogg') ||
        url.endsWith('.flac') ||
        url.endsWith('.aac')
      ) {
        audioRequests.push(url);
      }
    });

    console.log('[1/4] Carregando a aplicação no Desktop (1440x900)...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(500);

    // 2. Validar que nenhum arquivo de áudio externo foi requisitado da rede
    console.log('\n[2/4] Verificando conformidade com a regra AD-4 (zero assets externos de áudio)...');
    assert(
      audioRequests.length === 0,
      `Regra AD-4 violada: detectadas requisições de áudio externas: ${audioRequests.join(', ')}`
    );
    console.log('✓ Zero arquivos de áudio externos requisitados (100% sintetizado via Web Audio API)');

    // 3. Validar instância global e estado mudo por padrão
    console.log('\n[3/4] Validando singleton do motor de áudio e estado suspenso/mudo...');
    const initialAudioState = await page.evaluate(() => {
      const audio = window.bebopAudio;
      if (!audio) return { hasAudio: false };

      return {
        hasAudio: true,
        isMuted: audio.isMuted(),
        hasContext: !!audio.getContext(),
        contextState: audio.getContext() ? audio.getContext().state : 'none'
      };
    });

    assert(initialAudioState.hasAudio, 'window.bebopAudio deve estar registrado globalmente');
    assert(initialAudioState.isMuted === true, 'Motor de áudio deve iniciar mudo por padrão (muted: true)');
    console.log('✓ Motor de áudio disponível e estritamente mudo por padrão');

    // 4. Validar síntese de cada efeito sonoro e sincronização de eventos
    console.log('\n[4/4] Validando síntese em tempo real dos efeitos (Sonar, Knob, 8-Bit, Keypress, Bounty)...');
    const synthResults = await page.evaluate(async () => {
      const audio = window.bebopAudio;
      let eventReceived = false;
      let eventMutedValue = null;

      const handler = (e) => {
        eventReceived = true;
        eventMutedValue = e.detail ? e.detail.muted : null;
      };

      window.addEventListener('bebop:audio-mute-change', handler, { once: true });

      // Desmutar explicitamente
      audio.setMuted(false);
      const isUnmuted = !audio.isMuted();

      // Inicializar contexto
      const isRunning = await audio.initAudio();

      // Disparar funções de síntese sonora
      let errors = [];
      try { audio.playSonarBlip(880, 0.05, 0.1); } catch (e) { errors.push(`Sonar: ${e.message}`); }
      try { audio.playKnobClick(1200, 0.08); } catch (e) { errors.push(`Knob: ${e.message}`); }
      try { audio.playKeypressBeep(640, 0.02); } catch (e) { errors.push(`Keypress: ${e.message}`); }
      try { audio.playAlarm8Bit(1); } catch (e) { errors.push(`Alarm: ${e.message}`); }
      try { audio.playBountyAcquired(); } catch (e) { errors.push(`Bounty: ${e.message}`); }

      // Retornar ao estado mudo de segurança
      audio.setMuted(true);

      return {
        eventReceived,
        eventMutedValue,
        isUnmuted,
        isRunning,
        finalIsMuted: audio.isMuted(),
        errors
      };
    });

    assert(synthResults.eventReceived, 'Evento customizado bebop:audio-mute-change deve ser disparado');
    assert(synthResults.eventMutedValue === false, 'Evento deve conter o novo estado { muted: false }');
    assert(synthResults.errors.length === 0, `Erros durante a síntese sonora: ${synthResults.errors.join(', ')}`);
    assert(synthResults.finalIsMuted === true, 'Motor deve retornar com segurança para estado mudo');
    console.log('✓ Eventos customizados sincronizados com sucesso');
    console.log('✓ Funções playSonarBlip, playKnobClick, playKeypressBeep, playAlarm8Bit e playBountyAcquired sintetizadas com sucesso');
    console.log('✓ Segurança de áudio mantida e restaurada ao estado mudo');

    console.log('\n=============================================================');
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 5.1 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('❌ Erro durante o teste da História 5.1:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory51();
