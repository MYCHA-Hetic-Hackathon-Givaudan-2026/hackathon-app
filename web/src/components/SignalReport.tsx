import { useEffect, useId, useState } from 'react';
import {
  fetchSignal,
  formatYm,
  type Signal,
  type SignalDetail,
} from '../lib/signaux';

export type SignalReportProps = {
  /** Signal déjà connu via la liste (affichage immédiat). */
  signal: Signal;
  followed: boolean;
  followBusy?: boolean;
  onToggleFollow: () => void;
  onClose: () => void;
};

export function SignalReport({
  signal,
  followed,
  followBusy = false,
  onToggleFollow,
  onClose,
}: SignalReportProps) {
  const titleId = useId();
  const [detail, setDetail] = useState<SignalDetail | null>(null);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setDetail(null);
    setSourcesError(null);
    fetchSignal(signal.id, ac.signal)
      .then((row) => setDetail(row))
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        setSourcesError(
          err instanceof Error ? err.message : 'Sources indisponibles',
        );
      });
    return () => ac.abort();
  }, [signal.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const view = detail ?? signal;
  const durable = view.profil === 'durable';
  const verdict = durable ? 'Tendance durable' : 'Buzz';
  const sources = detail?.sources ?? [];

  return (
    <aside
      className="signal-report"
      aria-label="Détail du signal"
      aria-labelledby={titleId}
      role="dialog"
      aria-modal="false"
    >
      <div className="signal-report__head">
        <span
          className={
            durable
              ? 'signal-report__pill signal-report__pill--t'
              : 'signal-report__pill signal-report__pill--b'
          }
        >
          <span
            className={durable ? 'map-zone__dot' : 'map-zone__diamond'}
            aria-hidden="true"
          />
          {verdict}
        </span>
        <button
          type="button"
          className="signal-report__close"
          aria-label="Fermer le détail"
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
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="signal-report__title-block">
        <h2 id={titleId} className="signal-report__title">
          {view.nom}
        </h2>
        <p className="signal-report__meta">
          {view.famille} · {view.domaine} · {view.pays}
        </p>
      </div>

      <div className="signal-report__conf">
        <div className="signal-report__conf-row">
          <span>Confiance du modèle</span>
          <strong>{view.confiance_pct} %</strong>
        </div>
        <div
          className="signal-report__conf-track"
          role="meter"
          aria-label="Confiance du modèle"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={view.confiance_pct}
        >
          <div
            className={
              durable
                ? 'signal-report__conf-fill signal-report__conf-fill--t'
                : 'signal-report__conf-fill signal-report__conf-fill--b'
            }
            style={{ width: `${view.confiance_pct}%` }}
          />
        </div>
      </div>

      <div className="signal-report__actions">
        <button
          type="button"
          className={
            followed
              ? 'signal-report__btn signal-report__btn--follow signal-report__btn--follow-on'
              : 'signal-report__btn signal-report__btn--follow'
          }
          aria-pressed={followed}
          disabled={followBusy}
          onClick={onToggleFollow}
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
            <path d="M12 21s-7-4.5-7-10a7 7 0 0114 0c0 5.5-7 10-7 10z" />
          </svg>
          {followed ? 'Suivi' : 'Suivre'}
        </button>
        <button
          type="button"
          className="signal-report__btn signal-report__btn--ghost"
          disabled
          title="Disponible dans une prochaine itération"
        >
          Activer la veille IA
        </button>
      </div>

      <section className="signal-report__block">
        <h3 className="signal-report__label">Ce qui plaît</h3>
        <p className="signal-report__body signal-report__body--strong">
          {view.ce_qui_plait}
        </p>
      </section>

      <section className="signal-report__block">
        <h3 className="signal-report__label">Veille</h3>
        <p className="signal-report__body">{view.veille_resume}</p>
      </section>

      <section className="signal-report__block">
        <h3 className="signal-report__label">Matières premières liées</h3>
        <div className="signal-report__chips">
          {view.matieres.map((m) => (
            <span key={m} className="signal-report__chip">
              {m}
            </span>
          ))}
        </div>
      </section>

      <div className="signal-report__dates">
        <div className="signal-report__date">
          <div className="signal-report__date-label">Décollage</div>
          <div className="signal-report__date-value">
            {formatYm(view.decollage)}
          </div>
        </div>
        <div className="signal-report__date">
          <div className="signal-report__date-label">Prédit en</div>
          <div className="signal-report__date-value">
            {formatYm(view.predit_en)}
          </div>
        </div>
        <div className="signal-report__date">
          <div className="signal-report__date-label">Vérifiable</div>
          <div className="signal-report__date-value">
            {formatYm(view.verifiable_en)}
          </div>
        </div>
      </div>

      <section className="signal-report__block">
        <h3 className="signal-report__label">Sources</h3>
        {sourcesError ? (
          <p className="signal-report__sources-error" role="status">
            {sourcesError}
          </p>
        ) : null}
        {!sourcesError && sources.length === 0 ? (
          <p className="signal-report__sources-loading" role="status">
            Chargement des sources…
          </p>
        ) : null}
        <div className="signal-report__sources">
          {sources.map((s) => (
            <a
              key={s.url}
              className="signal-report__source"
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{s.label}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M7 17L17 7M10 7h7v7" />
              </svg>
            </a>
          ))}
        </div>
      </section>
    </aside>
  );
}
