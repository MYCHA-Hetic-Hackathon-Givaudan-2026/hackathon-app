import { navigate } from '../lib/navigate';
import type { Theme } from '../lib/theme';

type HeaderProps = {
  followCount?: number;
  onOpenFollows?: () => void;
  query?: string;
  onQueryChange?: (q: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
};

export function Header({
  followCount = 0,
  onOpenFollows,
  query = '',
  onQueryChange,
  theme,
  onToggleTheme,
}: HeaderProps) {
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
            <path d="M4 7h16M4 12h10M4 17h16" />
          </svg>
          {followCount > 0 ? (
            <span className="tr-header__menu-badge">{followCount}</span>
          ) : null}
        </button>
        <button
          type="button"
          className="tr-header__home"
          aria-label="Retour à l’accueil Forecastro"
          onClick={() => navigate('/')}
        >
          <span className="tr-header__name">
            FOREC<span>ASTRO</span>
          </span>
        </button>
      </div>

      <div className="tr-header__search-wrap">
        <label className="tr-header__search">
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
            placeholder="Rechercher un signal, un pays, une famille…"
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            disabled={!onQueryChange}
          />
        </label>
      </div>

      <div className="tr-header__aside">
        <div className="tr-header__status" role="status">
          <span className="tr-header__status-dot" aria-hidden="true" />
          Radar mondial
        </div>

        <button
          type="button"
          className="tr-header__theme"
          onClick={onToggleTheme}
          aria-label={
            theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
          }
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? (
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
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
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
              <path d="M21 14.5A8.5 8.5 0 1110.5 3 7 7 0 0021 14.5z" />
            </svg>
          )}
        </button>

        <div className="tr-header__user" aria-hidden="true">
          <span className="tr-header__avatar">CMI</span>
          <span className="tr-header__user-meta">
            <strong>Manager CMI</strong>
            <span>Givaudan</span>
          </span>
        </div>
      </div>
    </header>
  );
}
