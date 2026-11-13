import type { Fenetre } from '../lib/signaux';

export type FiltersBarProps = {
  query: string;
  onQueryChange: (q: string) => void;
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
};

export function FiltersBar({
  query,
  onQueryChange,
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
}: FiltersBarProps) {
  return (
    <div className="map-zone__toolbar">
      <div className="map-zone__intro">
        <p className="map-zone__eyebrow">Explorer</p>
        <h1 className="map-zone__title">Le monde bouge.</h1>
        <p className="map-zone__lead">
          Sélectionnez un signal pour comprendre ce qui change.
        </p>
      </div>

      <div className="map-zone__controls">
        <div className="map-zone__row">
          <label className="map-zone__search">
            <span className="visually-hidden">Rechercher un signal</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="Rechercher un signal"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="map-zone__chip map-zone__chip--t"
            aria-pressed={showDurable}
            onClick={onToggleDurable}
          >
            <span className="map-zone__dot" aria-hidden="true" />
            Tendances · {countDurable}
          </button>
          <button
            type="button"
            className="map-zone__chip map-zone__chip--b"
            aria-pressed={showBuzz}
            onClick={onToggleBuzz}
          >
            <span className="map-zone__diamond" aria-hidden="true" />
            Buzz · {countBuzz}
          </button>
        </div>

        <div className="map-zone__row">
          <div
            className="map-zone__window"
            role="group"
            aria-label="Fenêtre temporelle"
          >
            {(
              [
                ['7d', '7 jours'],
                ['30d', '30 jours'],
                ['90d', '90 jours'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={fenetre === id}
                onClick={() => onFenetreChange(fenetre === id ? null : id)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="map-zone__conf">
            Confiance ≥
            <input
              type="range"
              min={50}
              max={100}
              step={1}
              value={minConfiance}
              onChange={(e) => onMinConfianceChange(Number(e.target.value))}
            />
            <strong>{minConfiance} %</strong>
          </label>
        </div>
      </div>
    </div>
  );
}
