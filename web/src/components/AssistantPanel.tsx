import { useEffect, useRef } from 'react';
import { drawOrb } from '../lib/globe/drawOrb';

const SUGGESTIONS = [
  'Signaux émergents en Afrique',
  'Fais une veille sur Maritozzo',
];

type AssistantPanelProps = {
  focusOnMount?: boolean;
};

export function AssistantPanel({ focusOnMount = false }: AssistantPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame = 0;
    let raf = 0;
    const tick = (now: number) => {
      frame = now / 1000;
      drawOrb(canvas, frame, { size: 88 });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!focusOnMount) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
  }, [focusOnMount]);

  return (
    <aside className="assistant" aria-label="Assistant IA">
      <div className="assistant__top">
        <p className="assistant__eyebrow">
          <span className="assistant__eyebrow-dot" aria-hidden="true" />
          Assistant IA
        </p>
        <canvas
          ref={canvasRef}
          className="assistant__orb"
          width={88}
          height={88}
          aria-hidden="true"
        />
        <h2 className="assistant__hello">
          Bonjour.
          <span>Où allons-nous regarder aujourd&apos;hui ?</span>
        </h2>
      </div>

      <div className="assistant__chips">
        {SUGGESTIONS.map((label) => (
          <button
            key={label}
            type="button"
            className="assistant__chip"
            disabled
          >
            {label}
            <span className="assistant__chip-arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>

      <div className="assistant__thread" aria-live="polite">
        <div className="assistant__bubble">
          Posez une question CMI, ou explorez un signal sur le globe. Les
          réponses arriveront ici.
        </div>
      </div>

      <form
        className="assistant__composer"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="visually-hidden" htmlFor="assistant-input">
          Message à l&apos;assistant
        </label>
        <input
          ref={inputRef}
          id="assistant-input"
          className="assistant__input"
          name="message"
          placeholder="Demandez à TrendRadar…"
          autoComplete="off"
          disabled={!focusOnMount}
        />
        <button
          type="submit"
          className="assistant__send"
          aria-label="Envoyer"
          disabled
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </aside>
  );
}
