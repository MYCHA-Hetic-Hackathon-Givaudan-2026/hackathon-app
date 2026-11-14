import { useEffect, useState } from 'react';
import {
  BRIEF_AUDS,
  briefOf,
  type BriefAudId,
  type BriefSection,
} from '../lib/brief';
import type { Signal } from '../lib/signaux';

export type BriefModalProps = {
  signal: Signal;
  onClose: () => void;
  onCopied?: (msg: string) => void;
};

export function BriefModal({ signal, onClose, onCopied }: BriefModalProps) {
  const [aud, setAud] = useState<BriefAudId | null>(null);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<BriefSection[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function pickAud(id: BriefAudId) {
    setAud(id);
    setLoading(true);
    setSections([]);
    window.setTimeout(() => {
      setSections(briefOf(signal, id));
      setLoading(false);
    }, 900);
  }

  async function copyBrief() {
    if (!aud) return;
    const a = BRIEF_AUDS.find((x) => x.id === aud);
    if (!a) return;
    const txt = [
      `Brief ${a.label} · ${signal.nom}`,
      '',
      ...sections.map(
        (sec, i) =>
          `${String(i + 1).padStart(2, '0')} ${sec.h}\n${sec.items.map((it) => `- ${it.t}`).join('\n')}`,
      ),
    ].join('\n\n');
    try {
      await navigator.clipboard.writeText(txt);
      onCopied?.('Brief copié');
    } catch {
      onCopied?.('Copie impossible ici');
    }
  }

  const title = aud
    ? `Brief ${BRIEF_AUDS.find((a) => a.id === aud)?.label ?? ''}`
    : 'Générer un brief';

  return (
    <div className="brief-modal">
      <button
        type="button"
        className="brief-modal__backdrop"
        aria-label="Fermer le brief"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-label="Brief métier"
        className="brief-modal__panel"
      >
        <div className="brief-modal__head">
          <div className="brief-modal__titles">
            <span className="tr-kicker">{signal.nom}</span>
            <h2>{title}</h2>
          </div>
          <button
            type="button"
            className="brief-modal__close"
            aria-label="Fermer"
            onClick={onClose}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {!aud ? (
          <>
            <p className="brief-modal__hint">
              Pour quel public ? ASTRA adapte le contenu au métier.
            </p>
            <div className="brief-modal__auds">
              {BRIEF_AUDS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="brief-modal__aud"
                  onClick={() => pickAud(a.id)}
                >
                  <strong>{a.label}</strong>
                  <span>{a.desc}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="brief-modal__tabs" role="tablist">
              {BRIEF_AUDS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="tab"
                  className="brief-modal__tab"
                  aria-selected={aud === a.id}
                  onClick={() => pickAud(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="brief-modal__body">
              {loading ? (
                <div className="brief-modal__loading">
                  <span className="brief-modal__loading-dot" />
                  ASTRA rédige le brief…
                  <div className="tr-sk" style={{ width: '40%' }} />
                  <div className="tr-sk" style={{ width: '92%' }} />
                  <div className="tr-sk" style={{ width: '78%' }} />
                </div>
              ) : (
                <div className="brief-modal__sections">
                  {sections.map((sec, i) => (
                    <div key={sec.h} className="brief-modal__section">
                      <span className="tr-num">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <strong>{sec.h}</strong>
                        {sec.items.map((it) => (
                          <p key={it.t}>
                            <span className="brief-modal__bullet" />
                            {it.t}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="brief-modal__foot">
                    <span>Rédigé par ASTRA · données de démonstration</span>
                    <button
                      type="button"
                      className="brief-modal__copy"
                      onClick={() => void copyBrief()}
                    >
                      Copier le brief
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
