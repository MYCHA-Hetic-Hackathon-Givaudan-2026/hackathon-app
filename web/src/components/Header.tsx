type HeaderProps = {
  followCount?: number;
  onOpenFollows?: () => void;
};

export function Header({ followCount = 0, onOpenFollows }: HeaderProps) {
  return (
    <header className="tr-header">
      <div className="tr-header__brand">
        <button
          type="button"
          className="tr-header__menu"
          aria-label="Ouvrir le menu Signaux suivis"
          onClick={onOpenFollows}
          disabled={!onOpenFollows}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          {followCount > 0 ? (
            <span className="tr-header__menu-badge">{followCount}</span>
          ) : null}
        </button>
        <div className="tr-header__mark" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="8.5"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <ellipse
              cx="12"
              cy="12"
              rx="3.5"
              ry="8.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path d="M3.5 12h17" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
        <div className="tr-header__titles">
          <p className="tr-header__name">
            TrendRadar<span>/AI</span>
          </p>
          <p className="tr-header__subtitle">
            Givaudan · Consumer Market Insights
          </p>
        </div>
      </div>

      <div className="tr-header__status" role="status">
        <span className="tr-header__status-dot" aria-hidden="true" />
        Radar mondial en direct
      </div>

      {/* Auth Figma hors périmètre hackathon : stubs non branchés */}
      <div className="tr-header__actions">
        <button
          type="button"
          className="tr-header__ghost"
          disabled
          title="Hors périmètre"
        >
          Thème
        </button>
      </div>
    </header>
  );
}
