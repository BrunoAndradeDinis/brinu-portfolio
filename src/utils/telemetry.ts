/**
 * telemetry.ts
 * Utilitário de telemetria e recepção DevTools para o Bebop Brutalist Portfolio.
 * Emite o cupom fiscal ASCII retrô #1996 e registra getters globais mágicos no window (Regra AD-5).
 */

export function printBebopReceipt(): void {
  if (typeof console === 'undefined') return;

  const headerStyle = [
    'color: #2EFE0C',
    'background: #080808',
    'font-family: monospace',
    'font-size: 13px',
    'font-weight: bold',
    'padding: 8px 12px',
    'border: 2px solid #2EFE0C',
    'border-radius: 4px',
    'line-height: 1.4',
  ].join(';');

  const receiptStyle = [
    'color: #EBA602',
    'background: #11111E',
    'font-family: monospace',
    'font-size: 11px',
    'line-height: 1.4',
    'padding: 10px',
  ].join(';');

  console.log(
    '%c╔══════════════════════════════════════════════════════════╗\n' +
      '║    TELEMETRIA DETECTADA — BEM-VINDO A BORDO, COWBOY      ║\n' +
      '╚══════════════════════════════════════════════════════════╝',
    headerStyle
  );

  console.log(
    `%c============================================================
              [RECEIPT] BEBOP TRANSIT & BOUNTY RECEIPT #1996
------------------------------------------------------------
OPERADOR: Bruno de Andrade Dinis ("Brinu")
STATUS:   Pai da Helena | Noivo apaixonado
BASE:     Magalu Cloud (Software Engineer - Cloud & Front)
MISSAO:   Construir interfaces lendarias & arquitetura veloz
------------------------------------------------------------
ITEM  DESCRICAO                            VALOR / STATUS
01    GitHub Telemetry (76 repos)          [OK - @BrunoAndradeDinis]
02    LinkedIn Profile                     [OK - /in/bruno-de-andrade-dinis]
03    Engine AuraStream (Compute + S3)     [ONLINE 24/7]
04    Quake Log Parser (Docker + Jest)     [COVERAGE 100%]
05    Creative Lab Modules                 [3 PROTOTYPES ACTIVE]
------------------------------------------------------------
TOTAL: 100% CLEAN CODE, HARDCORE PERFORMANCE & PASSION
============================================================
COMANDOS EXECUTAVEIS NO CONSOLE (Digite direto no prompt):
  > whoami    -> Acessa a pagina/terminal secreta da nave
  > cilada    -> [ALERTA] Dispara o alarme de emergencia!
  > status    -> Reemite este cupom fiscal
  > projects  -> Links diretos para os repositorios
  > contact   -> Inicia contato direto via email
============================================================`,
    receiptStyle
  );
}

export function initTelemetry(): void {
  if (typeof window === 'undefined') return;

  // Imprime o cupom fiscal no primeiro carregamento
  printBebopReceipt();

  // Registra getters nativos no objeto window (Regra AD-5: sem necessidade de parênteses)
  try {
    Object.defineProperty(window, 'whoami', {
      get: () => {
        window.location.href = '/whoami';
        return '[TELEPORT] Acessando o terminal de bordo: /whoami';
      },
      configurable: true,
    });

    Object.defineProperty(window, 'cilada', {
      get: () => {
        window.dispatchEvent(new CustomEvent('bebop:cilada-trigger'));
        return '[ALERTA] Protocolo cilada ativado com sucesso.';
      },
      configurable: true,
    });

    Object.defineProperty(window, 'status', {
      get: () => {
        printBebopReceipt();
        return '[RECIBO] Cupom fiscal reimpresso no console.';
      },
      configurable: true,
    });

    Object.defineProperty(window, 'projects', {
      get: () => {
        console.table([
          {
            Projeto: 'AuraStream',
            Stack: 'Next.js 16 + FFmpeg + S3',
            URL: 'https://github.com/BrunoAndradeDinis/auraStream',
          },
          {
            Projeto: 'Quake Log Parser',
            Stack: 'Node.js + Jest + Docker',
            URL: 'https://github.com/BrunoAndradeDinis/quake-log-backend-node',
          },
          {
            Projeto: 'Jokenpo Arena',
            Stack: 'Next.js 14 + Tailwind',
            URL: 'https://jokenpo-three-psi.vercel.app',
          },
          {
            Projeto: 'The Warriors',
            Stack: 'SCSS + Gulp',
            URL: 'https://the-warriors-gamma.vercel.app',
          },
          {
            Projeto: 'Magalu Cloud',
            Stack: 'Distributed Cloud Architecture',
            URL: 'https://magalu.cloud',
          },
        ]);
        return '[PROJETOS] Tabela de projetos carregada acima.';
      },
      configurable: true,
    });

    Object.defineProperty(window, 'contact', {
      get: () => {
        window.location.href =
          'mailto:bruno.a.dinis96@gmail.com?subject=[Projeto/Proposta]%20Contato%20via%20Console';
        return '[CONTATO] Abrindo cliente de email...';
      },
      configurable: true,
    });
  } catch (err) {
    console.warn('[Telemetry] Falha ao registrar assessores globais:', err);
  }
}
