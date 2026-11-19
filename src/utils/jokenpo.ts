export const JOKENPO_CHOICES = ['pedra', 'papel', 'tesoura'] as const;

export type JokenpoChoice = (typeof JOKENPO_CHOICES)[number];
export type JokenpoResult = 'vitoria' | 'derrota' | 'empate';

export interface JokenpoScore {
  readonly win: number;
  readonly lose: number;
  readonly draw: number;
}

export const EMPTY_SCORE: JokenpoScore = { win: 0, lose: 0, draw: 0 };

const BEATS: Readonly<Record<JokenpoChoice, JokenpoChoice>> = {
  pedra: 'tesoura',
  tesoura: 'papel',
  papel: 'pedra',
};

export function decideWinner(player: JokenpoChoice, computer: JokenpoChoice): JokenpoResult {
  if (player === computer) return 'empate';
  return BEATS[player] === computer ? 'vitoria' : 'derrota';
}

export function randomChoice(random: () => number = secureRandom): JokenpoChoice {
  const index = Math.min(JOKENPO_CHOICES.length - 1, Math.floor(random() * JOKENPO_CHOICES.length));
  return JOKENPO_CHOICES[index];
}

export function addResult(score: JokenpoScore, result: JokenpoResult): JokenpoScore {
  return {
    win: score.win + (result === 'vitoria' ? 1 : 0),
    lose: score.lose + (result === 'derrota' ? 1 : 0),
    draw: score.draw + (result === 'empate' ? 1 : 0),
  };
}

function secureRandom(): number {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0] / 2 ** 32;
}
