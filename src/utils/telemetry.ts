import { PROFILE } from '../data/profile';

export function printBebopReceipt(): void {
  if (typeof console === 'undefined') return;

  const headerStyle = [
    'color: #FBFAF4',
    'background: #FE0000',
    'font-family: monospace',
    'font-size: 13px',
    'font-weight: bold',
    'padding: 8px 12px',
    'border: 2px solid #FBFAF4',
    'line-height: 1.4',
  ].join(';');

  const receiptStyle = [
    'color: #FBFAF4',
    'background: #080808',
    'font-family: monospace',
    'font-size: 11px',
    'line-height: 1.4',
    'padding: 10px',
    'border: 1px solid #FE0000',
  ].join(';');

  console.log(
    '%c╔══════════════════════════════════════════════════════════╗\n' +
      '║    TELEMETRIA DETECTADA — BEM-VINDO A BORDO, COWBOY      ║\n' +
      '╚══════════════════════════════════════════════════════════╝',
    headerStyle
  );

  console.log(
    `%c============================================================
              [RECEIPT] PHANTOM & BEBOP BOUNTY RECEIPT #1996
------------------------------------------------------------
OPERADOR: ${PROFILE.fullName} ("${PROFILE.handle}")
STATUS:   ${PROFILE.family['pt-br']}
BASE:     ${PROFILE.location.remoteLabel['pt-br']}
EMAIL:    ${PROFILE.email}
LINKEDIN: ${PROFILE.linkedin.handle}
------------------------------------------------------------
ITEM  DESCRICAO                            VALOR / STATUS
01    GitHub Telemetry                     [OK - ${PROFILE.github.handle}]
02    LinkedIn Profile                     [OK - ${PROFILE.linkedin.handle}]
03    Engine AuraStream (Magalu Cloud S3)  [ONLINE 24/7]
04    Quake Log Parser (Docker + Jest)     [COVERAGE 100%]
05    Creative Lab Modules                 [3 PROTOTYPES ACTIVE]
------------------------------------------------------------
TOTAL: 100% CLEAN CODE, SOLID ARCHITECTURE & PASSION
============================================================
COMANDOS EXECUTAVEIS NO CONSOLE:
  > whoami    -> Acessa o terminal interativo /whoami
  > cilada    -> [ALERTA] Dispara o alarme de emergencia!
  > status    -> Reemite este cupom fiscal
  > projects  -> Lista os projetos em tabela
  > contact   -> Inicia contato direto via email
============================================================`,
    receiptStyle
  );
}

export function initTelemetry(): void {
  if (typeof window === 'undefined') return;

  printBebopReceipt();

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
            Stack: 'Next.js 16 + FFmpeg + Magalu Cloud (VM & S3)',
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
        ]);
        return '[PROJETOS] Tabela de projetos carregada acima.';
      },
      configurable: true,
    });

    Object.defineProperty(window, 'contact', {
      get: () => {
        window.location.href = `mailto:${PROFILE.email}?subject=[Projeto/Proposta]%20Contato%20via%20Console`;
        return '[CONTATO] Abrindo cliente de email...';
      },
      configurable: true,
    });
  } catch (err) {
    console.warn('[Telemetry] Falha ao registrar assessores globais:', err);
  }
}
