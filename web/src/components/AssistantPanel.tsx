import { useEffect, useRef, useState } from 'react';
import { drawOrb } from '../lib/globe/drawOrb';
import { postAgentMessage, type AgentAction } from '../lib/suivis';

const SUGGESTIONS = [
  'Signaux émergents en Afrique',
  'Fais une veille sur Maritozzo',
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
            disabled={busy}
            onClick={() => void send(label)}
          >
            {label}
            <span className="assistant__chip-arrow" aria-hidden="true">
              →
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
          Message à l&apos;assistant
        </label>
        <input
          ref={inputRef}
          id="assistant-input"
          className="assistant__input"
          name="message"
          placeholder="Demandez à TrendRadar…"
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
