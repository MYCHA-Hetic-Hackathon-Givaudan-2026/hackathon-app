import { useEffect, useId, useState } from 'react';
import { reasonsOf, mpOf } from '../lib/brief';
import {
  fetchSignal,
  formatYm,
  type Signal,
  type SignalDetail,
} from '../lib/signaux';
import type { Veille } from '../lib/suivis';

export type SignalReportProps = {
  signal: Signal;
  followed: boolean;
  hasVeille?: boolean;
  followBusy?: boolean;
  veilleBusy?: boolean;
  veilles?: Veille[];
  onToggleFollow: () => void;
  onActivateVeille: () => void;
  onClose: () => void;
  onToast?: (msg: string) => void;
  onAskVeille?: (nom: string) => void;
};

export function SignalReport({
  signal,
  followed,
  hasVeille = false,
  followBusy = false,
  veilleBusy = false,
  veilles = [],
  onToggleFollow,
  onActivateVeille,
  onClose,
  onToast,
  onAskVeille,
}: SignalReportProps) {
  const titleId = useId();
  const [detail, setDetail] = useState<SignalDetail | null>(null);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

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
      if (e.key === 'Escape' && !briefOpen) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, briefOpen]);

  const view = detail ?? signal;
  const durable = view.profil === 'durable';
  const verdict = durable ? 'Tendance durable' : 'Buzz';
  const sources = detail?.sources ?? [];
  const reasons = reasonsOf(view);
  const mps = mpOf(view);
  const division =
    view.domaine === 'Parfum' ? 'Fragrance & Beauty' : 'Taste & Wellbeing';

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
        {hasVeille ? (
          <div className="signal-report__veille-on" role="status">
            <span className="signal-report__veille-dot" aria-hidden="true" />
            Veille activée
            <button
              type="button"
              className="signal-report__veille-refresh"
              disabled={veilleBusy}
              onClick={onActivateVeille}
            >
              {veilleBusy ? '…' : 'Actualiser'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="signal-report__btn signal-report__btn--ghost"
            disabled={veilleBusy || followBusy}
            onClick={onActivateVeille}
          >
            {veilleBusy ? 'Veille en cours…' : 'Activer la veille IA'}
          </button>
        )}
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
        {veilles.length > 0 ? (
          <ul className="signal-report__veilles">
            {veilles.map((v) => (
              <li key={v.id} className="signal-report__veille-item">
                <time dateTime={v.created_at}>
                  {new Date(v.created_at).toLocaleString('fr-FR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
                <p>{v.texte}</p>
              </li>
            ))}
          </ul>
        ) : null}
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

            <div className="signal-report__title-block">
              <h2 id={titleId} className="signal-report__title">
                {view.nom}
              </h2>
              <p className="signal-report__meta">
                {view.famille} · {division}
              </p>
            </div>

            <div className="signal-report__conf-hero">
              <span
                className={
                  durable
                    ? 'signal-report__pct signal-report__pct--t'
                    : 'signal-report__pct signal-report__pct--b'
                }
              >
                {view.confiance_pct}%
              </span>
              <span className="signal-report__conf-side">
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
                <span className="signal-report__conf-caption">
                  de confiance du modèle
                </span>
              </span>
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

          <div className="signal-report__dates">
            <div className="signal-report__date">
              <div className="signal-report__date-label">Décollage</div>
              <div className="signal-report__date-value">
                {formatYm(view.decollage)}
              </div>
            </div>
            <div className="signal-report__date">
              <div className="signal-report__date-label">Prédiction</div>
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

          <div className="signal-report__sections">
            <section className="signal-report__section">
              <span className="tr-num">01</span>
              <div>
                <strong>
                  {durable
                    ? 'Pourquoi c’est une tendance'
                    : 'Pourquoi c’est un buzz'}
                </strong>
                {reasons.map((r) => (
                  <p key={r} className="signal-report__reason">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={durable ? 'var(--tr-tendance)' : 'var(--tr-buzz)'}
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                    <span>{r}</span>
                  </p>
                ))}
              </div>
            </section>

            <section className="signal-report__section">
              <span className="tr-num">02</span>
              <div>
                <strong>Ce qui plaît</strong>
                <p className="signal-report__body">{view.ce_qui_plait}</p>
              </div>
            </section>

            <section className="signal-report__section">
              <span className="tr-num">03</span>
              <div>
                <strong>Ce qui se dit</strong>
                <p className="signal-report__body">{view.veille_resume}</p>
                {onAskVeille ? (
                  <button
                    type="button"
                    className="signal-report__veille"
                    onClick={() => onAskVeille(view.nom)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                    </svg>
                    Lancer la veille IA
                  </button>
                ) : (
                  <button
                    type="button"
                    className="signal-report__veille"
                    disabled
                    title="Branche agent / veille"
                  >
                    Lancer la veille IA
                  </button>
                )}
              </div>
            </section>

            <section className="signal-report__section">
              <span className="tr-num">04</span>
              <div>
                <div className="signal-report__mp-head">
                  <strong>Matières premières</strong>
                  <span>tension prix estimée</span>
                </div>
                <ul className="signal-report__mps">
                  {mps.map((mp) => (
                    <li key={mp.name}>
                      <span>{mp.name}</span>
                      <span
                        className="signal-report__mp-tag"
                        style={{ color: mp.color, background: mp.bg }}
                      >
                        {mp.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="signal-report__section signal-report__section--last">
              <span className="tr-num">05</span>
              <div>
                <strong>Sources</strong>
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
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M7 17L17 7M9 7h8v8" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="signal-report__sticky">
          <button
            type="button"
            className="signal-report__btn signal-report__btn--brief"
            onClick={() => setBriefOpen(true)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
              <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
            </svg>
            Générer un brief
          </button>
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
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={followed ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 4h12v17l-6-4-6 4z" />
            </svg>
            {followed ? 'Suivi' : 'Suivre'}
          </button>
        </div>
      </aside>

      {briefOpen ? (
        <BriefModal
          signal={view}
          onClose={() => setBriefOpen(false)}
          onCopied={(msg) => onToast?.(msg)}
        />
      ) : null}
    </>
  );
}
