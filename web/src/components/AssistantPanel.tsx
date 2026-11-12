import { useEffect, useRef, useState } from 'react';
import { drawOrb } from '../lib/globe/drawOrb';

const SUGGESTIONS = [
  'Quelle est la tendance la plus sûre ?',
  'Une tendance liée à l’huile de coco',
  'Une confiserie sûre à 80 % minimum',
  'Quels buzz faut-il éviter ?',
];

type AssistantPanelProps = {
  focusOnMount?: boolean;
  open?: boolean;
  onClose?: () => void;
};

export function AssistantPanel({
  focusOnMount = false,
  open = true,
  onClose,
}: AssistantPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !open) return;

    let raf = 0;
    const tick = (now: number) => {
      drawOrb(canvas, now / 1000, { size: 88 });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!focusOnMount || !open) return;
    inputRef.current?.focus();
  }, [focusOnMount, open]);

  if (!open) return null;

  return (
    <aside className="assistant" aria-label="ASTRA, assistant IA">
      <div className="assistant__top">
        <div className="assistant__top-row">
          <p className="assistant__eyebrow">
            <span className="assistant__eyebrow-dot" aria-hidden="true" />
            ASTRA · Assistant IA
          </p>
          {onClose ? (
            <button
              type="button"
              className="assistant__collapse"
              aria-label="Replier ASTRA"
              onClick={onClose}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
          ) : null}
        </div>

        <div className="assistant__hello-row">
          <canvas
            ref={canvasRef}
            className="assistant__orb"
            width={88}
            height={88}
            aria-hidden="true"
          />
          <div className="assistant__hello">
            <strong>Je suis ASTRA.</strong>
            <span>Que puis-je faire pour toi ?</span>
          </div>
        </div>
      </div>

      <div className="assistant__chips">
        {SUGGESTIONS.map((label) => (
          <button
            key={label}
            type="button"
            className="assistant__chip"
            disabled
            title="Branche agent conversationnel"
          >
            {label}
            <span className="assistant__chip-arrow" aria-hidden="true">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        ))}
      </div>

      <div className="assistant__thread" aria-live="polite">
        <div className="assistant__msg">
          <span className="assistant__avatar" aria-hidden="true" />
          <div className="assistant__bubble">
            Bonjour, je suis ASTRA. Je surveille les signaux de la semaine. Que
            puis-je faire pour toi ?
          </div>
        </div>
      </div>

      <form
        className="assistant__composer"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="visually-hidden" htmlFor="assistant-input">
          Message à ASTRA
        </label>
        <input
          ref={inputRef}
          id="assistant-input"
          className="assistant__input"
          name="message"
          placeholder="Demandez à ASTRA…"
          autoComplete="off"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="submit"
          className="assistant__send"
          aria-label="Envoyer"
          disabled
          title="Branche agent conversationnel"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </aside>
  );
}
