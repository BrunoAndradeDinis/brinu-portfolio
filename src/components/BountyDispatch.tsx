import React, { useState } from 'react';
import { audioSynth } from '../utils/audio';

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export const BountyDispatch: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [dispatchTime, setDispatchTime] = useState<string>('');

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Identificador/Codename obrigatório.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Frequência de comunicação (e-mail) obrigatória.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Frequência de e-mail inválida.';
    }

    if (!message.trim()) {
      nextErrors.message = 'Payload da proposta não pode ser vazio.';
    } else if (message.trim().length < 10) {
      nextErrors.message = 'Payload deve conter pelo menos 10 caracteres.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      if (!audioSynth.isMuted()) {
        audioSynth.playAlarm8Bit(1);
      }
      return;
    }

    // Sucesso na validação e transmissão
    setIsSubmitted(true);
    setDispatchTime(new Date().toUTCString());

    if (!audioSynth.isMuted()) {
      audioSynth.playBountyAcquired();
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setMessage('');
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <div
      data-bounty-dispatch
      className="rounded-3xl border-4 border-space-base bg-space-surface-2/95 p-6 sm:p-8 font-mono shadow-comic-lg text-paper-white relative overflow-hidden"
    >
      {/* Cabeçalho do Terminal de Dispatch */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-space-border/60">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-bebop-amber" />
          <span className="font-bold text-xs uppercase tracking-widest text-bebop-amber">
            // BOUNTY DISPATCH CONSOLE
          </span>
        </div>

        <span className="text-[10px] sm:text-xs text-muted-gray uppercase">
          SECURE QUANTUM CHANNEL
        </span>
      </div>

      {!isSubmitted ? (
        /* Formulário Ativo */
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Campo Nome / Codename */}
          <div>
            <label
              htmlFor="dispatch-name"
              className="block text-xs uppercase tracking-wider text-muted-gray mb-1.5 font-bold"
            >
              01 // SENDER CODENAME (SEU NOME / EMPRESA)
            </label>
            <input
              id="dispatch-name"
              data-input-name
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Ex: Spike Spiegel / Redline Syndicate"
              className={`w-full px-4 py-3 rounded-xl border-2 bg-space-base text-paper-white placeholder:text-muted-gray/50 text-xs sm:text-sm font-mono focus:outline-none transition-all shadow-comic-xs ${
                errors.name
                  ? 'border-bebop-red focus:ring-2 focus:ring-bebop-red'
                  : 'border-space-border focus:border-acid-green focus:ring-2 focus:ring-acid-green/40'
              }`}
            />
            {errors.name && (
              <span data-error-name className="text-bebop-red text-[11px] mt-1 block font-bold">
                ⚠ {errors.name}
              </span>
            )}
          </div>

          {/* Campo E-mail / Frequência */}
          <div>
            <label
              htmlFor="dispatch-email"
              className="block text-xs uppercase tracking-wider text-muted-gray mb-1.5 font-bold"
            >
              02 // COMM FREQUENCY (SEU E-MAIL DE RETORNO)
            </label>
            <input
              id="dispatch-email"
              data-input-email
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="Ex: contato@empresa.com"
              className={`w-full px-4 py-3 rounded-xl border-2 bg-space-base text-paper-white placeholder:text-muted-gray/50 text-xs sm:text-sm font-mono focus:outline-none transition-all shadow-comic-xs ${
                errors.email
                  ? 'border-bebop-red focus:ring-2 focus:ring-bebop-red'
                  : 'border-space-border focus:border-acid-green focus:ring-2 focus:ring-acid-green/40'
              }`}
            />
            {errors.email && (
              <span data-error-email className="text-bebop-red text-[11px] mt-1 block font-bold">
                ⚠ {errors.email}
              </span>
            )}
          </div>

          {/* Campo Mensagem / Payload */}
          <div>
            <label
              htmlFor="dispatch-message"
              className="block text-xs uppercase tracking-wider text-muted-gray mb-1.5 font-bold"
            >
              03 // CONTRACT PAYLOAD (DETALHES DA PROPOSTA / ESCOPO)
            </label>
            <textarea
              id="dispatch-message"
              data-input-message
              rows={4}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
              }}
              placeholder="Descreva o escopo do projeto, prazos e expectativas técnicas..."
              className={`w-full px-4 py-3 rounded-xl border-2 bg-space-base text-paper-white placeholder:text-muted-gray/50 text-xs sm:text-sm font-mono focus:outline-none transition-all resize-none shadow-comic-xs ${
                errors.message
                  ? 'border-bebop-red focus:ring-2 focus:ring-bebop-red'
                  : 'border-space-border focus:border-acid-green focus:ring-2 focus:ring-acid-green/40'
              }`}
            />
            {errors.message && (
              <span data-error-message className="text-bebop-red text-[11px] mt-1 block font-bold">
                ⚠ {errors.message}
              </span>
            )}
          </div>

          {/* Botão de Envio de Transmissão */}
          <button
            type="submit"
            data-dispatch-submit-btn
            className="w-full py-3.5 px-6 rounded-xl border-2 border-space-base bg-paper-white text-space-base font-mono font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-acid-green hover:border-space-base transition-all duration-200 shadow-comic-sm active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2"
          >
            <span>TRANSMIT CONTRACT PAYLOAD</span>
            <span>🚀</span>
          </button>
        </form>
      ) : (
        /* Recibo de Confirmação HUD */
        <div data-dispatch-receipt className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-acid-green/15 border border-acid-green text-acid-green">
            <span className="w-2.5 h-2.5 rounded-full bg-acid-green animate-ping" />
            <span className="font-bold text-xs uppercase tracking-wider">
              TRANSMISSION ENCRYPTED // 100% DISPATCHED!
            </span>
          </div>

          <div className="p-4 rounded-xl border border-space-border/80 bg-space-base/90 space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-space-border/40 pb-1.5">
              <span className="text-muted-gray">CODENAME:</span>
              <span className="text-paper-white font-bold">{name}</span>
            </div>
            <div className="flex justify-between border-b border-space-border/40 pb-1.5">
              <span className="text-muted-gray">FREQUENCY:</span>
              <span className="text-acid-green font-bold">{email}</span>
            </div>
            <div className="flex justify-between border-b border-space-border/40 pb-1.5">
              <span className="text-muted-gray">STATUS:</span>
              <span className="text-crt-cyan font-bold">RECEIVED ON BEBOP SENSORS</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-muted-gray">TIMESTAMP:</span>
              <span className="text-muted-gray text-[10px]">{dispatchTime}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`mailto:bruno.a.dinis96@gmail.com?subject=[Bounty%20Contract]%20Proposta%20de%20${encodeURIComponent(
                name
              )}&body=${encodeURIComponent(
                `Codename: ${name}\nEmail: ${email}\n\nMensagem:\n${message}`
              )}`}
              className="flex-1 py-3 px-4 rounded-xl border-2 border-space-base bg-bebop-red text-paper-white text-center font-bold text-xs uppercase tracking-wider hover:bg-paper-white hover:text-space-base transition-all shadow-comic-xs"
            >
              ENVIAR CÓPIA POR E-MAIL ✉
            </a>

            <button
              type="button"
              data-new-transmission-btn
              onClick={handleReset}
              className="py-3 px-4 rounded-xl border-2 border-space-border bg-space-surface-1 text-paper-white font-bold text-xs uppercase tracking-wider hover:border-acid-green hover:text-acid-green transition-all shadow-comic-xs"
            >
              NOVA TRANSMISSÃO ↺
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BountyDispatch;
