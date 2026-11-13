import { useEffect } from 'react';
import type { Suivi } from '../lib/suivis';

export type FollowMenuProps = {
  open: boolean;
  suivis: Suivi[];
  onClose: () => void;
  onPick: (signalId: number) => void;
};

export function FollowMenu({ open, suivis, onClose, onPick }: FollowMenuProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="follow-menu__backdrop"
        aria-label="Fermer le menu des suivis"
        onClick={onClose}
      />
      <aside className="follow-menu" aria-label="Menu Signaux suivis">
        <div className="follow-menu__head">
          <p className="follow-menu__brand">TrendRadar</p>
          <button
            type="button"
            className="follow-menu__close"
            aria-label="Fermer le menu"
            onClick={onClose}
          >
            <svg
              width="18"
              height="18"
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

        <nav className="follow-menu__nav" aria-label="Signaux suivis">
          <div className="follow-menu__nav-item" aria-current="page">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 21s-7-4.5-7-10a7 7 0 0114 0c0 5.5-7 10-7 10z" />
              <circle cx="12" cy="11" r="2.5" />
            </svg>
            Signaux suivis
            <span className="follow-menu__count">{suivis.length}</span>
          </div>
        </nav>

        <div className="follow-menu__list">
          {suivis.length === 0 ? (
            <p className="follow-menu__empty">
              Aucun signal suivi pour l&apos;instant. Ouvrez un signal sur le
              globe et cliquez sur « Suivre ».
            </p>
          ) : (
            suivis.map((suivi) => {
              const s = suivi.signal;
              const durable = s.profil === 'durable';
              return (
                <button
                  key={suivi.id}
                  type="button"
                  className="follow-menu__item"
                  onClick={() => {
                    onPick(s.id);
                    onClose();
                  }}
                >
                  <span
                    className={
                      durable
                        ? 'follow-menu__mark follow-menu__mark--t'
                        : 'follow-menu__mark follow-menu__mark--b'
                    }
                    aria-hidden="true"
                  />
                  <span className="follow-menu__item-text">
                    <span className="follow-menu__item-name">{s.nom}</span>
                    <span className="follow-menu__item-meta">
                      {durable ? 'Tendance durable' : 'Buzz'} ·{' '}
                      {s.confiance_pct} % · {s.pays}
                    </span>
                  </span>
                  {suivi.has_veille ? (
                    <span className="follow-menu__badge">Veille</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
