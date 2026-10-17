/**
 * src/utils/audio.ts
 * Motor de Síntese Sonora Nativo (Web Audio API).
 * Invariante AD-4: Todos os efeitos sonoros são sintetizados matematicamente em tempo real.
 * Zero assets de áudio externos (zero MP3/WAV/OGG).
 * Permanece mudo por padrão (muted: true) até consentimento explícito do usuário.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private muted: boolean = true;
  private masterGain: GainNode | null = null;

  constructor() {
    // Escuta preferências salvas se estiver no navegador
    if (typeof window !== 'undefined') {
      try {
        const storedMute = localStorage.getItem('bebop:audio-muted');
        if (storedMute !== null) {
          this.muted = storedMute === 'true';
        }
      } catch {
        // Fallback para ambientes restritos de storage
        this.muted = true;
      }
    }
  }

  /**
   * Obtém ou inicializa a instância do AudioContext
   */
  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    return this.ctx;
  }

  /**
   * Inicializa e desbloqueia o AudioContext após gesto do usuário
   */
  public async initAudio(): Promise<boolean> {
    const ctx = this.getContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        return false;
      }
    }

    return ctx.state === 'running';
  }

  /**
   * Verifica se o áudio está mudo
   */
  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Define o estado de mudo com sincronização de evento customizado
   */
  public setMuted(muted: boolean): boolean {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bebop:audio-muted', String(muted));
      } catch {
        // Ignora erro de storage
      }

      window.dispatchEvent(
        new CustomEvent('bebop:audio-mute-change', {
          detail: { muted: this.muted }
        })
      );
    }

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
    }

    if (!muted) {
      this.initAudio();
    }

    return this.muted;
  }

  /**
   * Alterna o estado de mudo
   */
  public toggleMute(): boolean {
    return this.setMuted(!this.muted);
  }

  /**
   * Sintetiza o Blip de Sonar do Bounty Radar (880Hz, seno puro com decaimento suave de 50ms)
   */
  public playSonarBlip(frequency: number = 880, duration: number = 0.05, volume: number = 0.15): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Ignora erro de execução de nó descartado
    }
  }

  /**
   * Sintetiza o clique analógico mecânico de rotação do knob CRT
   */
  public playKnobClick(frequency: number = 1200, volume: number = 0.08): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.015);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.018);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Ignora erro de transiente
    }
  }

  /**
   * Sintetiza o bipe tátil de tecla do terminal
   */
  public playKeypressBeep(frequency: number = 640, duration: number = 0.02, volume: number = 0.04): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Ignora
    }
  }

  /**
   * Sintetiza o alarme de emergência 8-bit ("É uma cilada Brinu!")
   */
  public playAlarm8Bit(cycles: number = 3): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const stepDuration = 0.08;

      for (let i = 0; i < cycles; i++) {
        const t1 = now + i * (stepDuration * 2);
        const t2 = t1 + stepDuration;

        // Tom agudo
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(920, t1);
        gain1.gain.setValueAtTime(0.1, t1);
        gain1.gain.setValueAtTime(0.0001, t1 + stepDuration);
        osc1.connect(gain1);
        gain1.connect(this.masterGain || ctx.destination);
        osc1.start(t1);
        osc1.stop(t1 + stepDuration);

        // Tom grave
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(740, t2);
        gain2.gain.setValueAtTime(0.1, t2);
        gain2.gain.setValueAtTime(0.0001, t2 + stepDuration);
        osc2.connect(gain2);
        gain2.connect(this.masterGain || ctx.destination);
        osc2.start(t2);
        osc2.stop(t2 + stepDuration);
      }
    } catch {
      // Ignora
    }
  }

  /**
   * Sintetiza o arpeggio harmônico de recompensa (Bounty Acquired)
   */
  public playBountyAcquired(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const noteDuration = 0.08;
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      try {
        const startTime = now + idx * noteDuration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.2);

        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      } catch {
        // Ignora
      }
    });
  }
}

// Exporta singleton canônico para toda a aplicação
export const audioSynth = new AudioSynthesizer();
export default audioSynth;
