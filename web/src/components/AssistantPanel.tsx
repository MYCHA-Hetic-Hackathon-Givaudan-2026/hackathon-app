import { useEffect, useRef, useState } from 'react';
import { drawOrb } from '../lib/globe/drawOrb';
import { postAgentMessage, type AgentAction } from '../lib/suivis';

const SUGGESTIONS = [
  'Quelle est la tendance la plus sûre ?',
  'Une tendance liée à l’huile de coco',
  'Une confiserie sûre à 80 % minimum',
  'Quels buzz faut-il éviter ?',
];

type ChatMsg = { role: 'user' | 'assistant'; text: string };

type AssistantPanelProps = {
  focusOnMount?: boolean;
  selectedSignalId?: number | null;
  selectedSignalName?: string | null;
  onAction?: (action: AgentAction) => void;
};

export function AssistantPanel({
  focusOnMount = false,
  selectedSignalId = null,
  selectedSignalName = null,
  onAction,
}: AssistantPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      text: 'Posez une question CMI, ou explorez un signal sur le globe. Les réponses arriveront ici.',
    },
  ]);

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

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [msgs, busy]);

  async function send(textArg?: string) {
    const text = (textArg ?? draft).trim();
    if (!text || busy) return;
    setDraft('');
    setMsgs((prev) => [...prev, { role: 'user', text }]);
    setBusy(true);
    try {
      const res = await postAgentMessage(text, selectedSignalId);
      setMsgs((prev) => [...prev, { role: 'assistant', text: res.reply }]);
      if (res.action) onAction?.(res.action);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Assistant indisponible';
      setMsgs((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Je n’ai pas pu joindre l’IA (${message}). L’historique des veilles est intact.`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

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
            disabled={busy}
            onClick={() => void send(label)}
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
        {selectedSignalName ? (
          <button
            type="button"
            className="assistant__chip"
            disabled={busy}
            onClick={() =>
              void send(`Fais une veille sur ${selectedSignalName}`)
            }
          >
            Fais une veille sur {selectedSignalName}
            <span className="assistant__chip-arrow" aria-hidden="true">
              →
            </span>
          </button>
        ) : null}
      </div>

      <div ref={threadRef} className="assistant__thread" aria-live="polite">
        {msgs.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={
              m.role === 'user'
                ? 'assistant__bubble assistant__bubble--user'
                : 'assistant__bubble'
            }
          >
            {m.text}
          </div>
        ))}
        {busy ? (
          <div className="assistant__bubble assistant__bubble--busy">
            Analyse en cours…
          </div>
        ) : null}
      </div>

      <form
        className="assistant__composer"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
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
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="submit"
          className="assistant__send"
          aria-label="Envoyer"
          disabled={busy || !draft.trim()}
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
