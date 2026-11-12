type FiltersBarProps = {
  minConfiance?: number;
  fenetre?: '7d' | '30d' | '90d';
};

export function FiltersBar({
  minConfiance = 50,
  fenetre = '7d',
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
            <input type="search" placeholder="Rechercher un signal" disabled />
          </label>
          <button
            type="button"
            className="map-zone__chip map-zone__chip--t"
            disabled
          >
            <span className="map-zone__dot" aria-hidden="true" />
            Tendances · —
          </button>
          <button
            type="button"
            className="map-zone__chip map-zone__chip--b"
            disabled
          >
            <span className="map-zone__diamond" aria-hidden="true" />
            Buzz · —
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
                disabled
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
              defaultValue={minConfiance}
              disabled
            />
            <strong>{minConfiance} %</strong>
          </label>
        </div>
      </div>
    </div>
  );
}
