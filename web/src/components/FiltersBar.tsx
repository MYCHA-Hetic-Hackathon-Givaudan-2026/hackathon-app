import { useState } from 'react';
import type { Fenetre } from '../lib/signaux';

export type FiltersBarProps = {
  showDurable: boolean;
  showBuzz: boolean;
  onToggleDurable: () => void;
  onToggleBuzz: () => void;
  countDurable: number;
  countBuzz: number;
  minConfiance: number;
  onMinConfianceChange: (n: number) => void;
  fenetre: Fenetre | null;
  onFenetreChange: (f: Fenetre | null) => void;
  domaine: 'all' | 'gout' | 'parfum';
  onDomaineChange: (d: 'all' | 'gout' | 'parfum') => void;
  countGout: number;
  countParfum: number;
};

export function FiltersBar({
  showDurable,
  showBuzz,
  onToggleDurable,
  onToggleBuzz,
  countDurable,
  countBuzz,
  minConfiance,
  onMinConfianceChange,
  fenetre,
  onFenetreChange,
  domaine,
  onDomaineChange,
  countGout,
  countParfum,
}: FiltersBarProps) {
  const [open, setOpen] = useState(false);
  const activeCount =
    (domaine !== 'all' ? 1 : 0) +
    (minConfiance !== 50 ? 1 : 0) +
    (fenetre ? 1 : 0);
  const confPct = ((minConfiance - 50) * 2).toFixed(0);

  return (
    <>
      {open ? (
        <section className="filter-pop" aria-label="Filtres">
          <div className="filter-pop__head">
            <span className="filter-pop__title">Filtres</span>
            <button
              type="button"
              className="filter-pop__reset"
              onClick={() => {
                onDomaineChange('all');
                onMinConfianceChange(50);
                onFenetreChange(null);
              }}
            >
              Réinitialiser
            </button>
          </div>

          <div
            className="filter-pop__group"
            role="radiogroup"
            aria-label="Division Givaudan"
          >
            <span className="tr-kicker">Division</span>
            <div className="filter-pop__cards">
              <button
                type="button"
                className="filter-pop__card"
                role="radio"
                aria-checked={domaine === 'gout'}
                onClick={() =>
                  onDomaineChange(domaine === 'gout' ? 'all' : 'gout')
                }
              >
                <strong>Taste &amp; Wellbeing</strong>
                <span>{countGout} signaux</span>
              </button>
              <button
                type="button"
                className="filter-pop__card"
                role="radio"
                aria-checked={domaine === 'parfum'}
                onClick={() =>
                  onDomaineChange(domaine === 'parfum' ? 'all' : 'parfum')
                }
              >
                <strong>Fragrance &amp; Beauty</strong>
                <span>{countParfum} signaux</span>
              </button>
            </div>
          </div>

          <div className="filter-pop__group">
            <div className="filter-pop__conf-head">
              <span className="tr-kicker">Confiance du modèle</span>
              <strong>
                {minConfiance === 50 ? 'Tous' : `${minConfiance} % et +`}
              </strong>
            </div>
            <label className="filter-pop__range">
              <span className="visually-hidden">Confiance minimale</span>
              <input
                className="tr-range"
                type="range"
                min={50}
                max={100}
                step={5}
                value={minConfiance}
                onChange={(e) => onMinConfianceChange(Number(e.target.value))}
                style={{
                  background: `linear-gradient(90deg, var(--tr-accent-deep) 0%, var(--tr-accent) ${confPct}%, rgba(225,224,217,0.12) ${confPct}%)`,
                }}
              />
            </label>
            <div className="filter-pop__ticks">
              <span>50 %</span>
              <span>75 %</span>
              <span>100 %</span>
            </div>
          </div>

          <div
            className="filter-pop__group"
            role="group"
            aria-label="Fenêtre temporelle"
          >
            <span className="tr-kicker">Fenêtre</span>
            <div className="filter-pop__window">
              {(
                [
                  ['7d', '7 j'],
                  ['30d', '30 j'],
                  ['90d', '90 j'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className="filter-pop__tab"
                  aria-pressed={fenetre === id}
                  onClick={() => onFenetreChange(fenetre === id ? null : id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <nav className="filter-dock" aria-label="Affichage">
        <button
          type="button"
          className="tr-pill tr-pill--t"
          aria-pressed={showDurable}
          onClick={onToggleDurable}
        >
          <span className="tr-pill__dot" aria-hidden="true" />
          Tendances
          <span className="tr-pill__cnt">{countDurable}</span>
        </button>
        <button
          type="button"
          className="tr-pill tr-pill--b"
          aria-pressed={showBuzz}
          onClick={onToggleBuzz}
        >
          <span className="tr-pill__diamond" aria-hidden="true" />
          Buzz
          <span className="tr-pill__cnt">{countBuzz}</span>
        </button>
        <span className="filter-dock__sep" aria-hidden="true" />
        <button
          type="button"
          className="tr-pill"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="10" cy="17" r="2" />
          </svg>
          Filtres
          {activeCount > 0 ? (
            <span className="tr-pill__badge">{activeCount}</span>
          ) : null}
        </button>
      </nav>
    </>
  );
}
