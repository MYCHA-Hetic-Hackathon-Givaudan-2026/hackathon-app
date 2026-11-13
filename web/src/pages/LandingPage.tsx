import { useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { drawOrb } from '../lib/globe/drawOrb';
import { navigate } from '../lib/navigate';

export function LandingPage() {
  const orbRef = useRef<HTMLCanvasElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const canvas = orbRef.current;
    if (!canvas) return;

    let raf = 0;
    const tick = (now: number) => {
      drawOrb(canvas, now / 1000, { size: 220 });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <main className="landing">
      <button
        type="button"
        className="landing__theme"
        onClick={toggleTheme}
        aria-label={
          theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
        }
      >
        {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      </button>

      <div className="landing__atmosphere" aria-hidden="true">
        <div className="landing__glow landing__glow--a" />
        <div className="landing__glow landing__glow--b" />
        <canvas
          ref={orbRef}
          className="landing__orb"
          width={220}
          height={220}
        />
      </div>

      <div className="landing__content">
        <p className="landing__brand">
          FOREC<span>ASTRO</span>
        </p>
        <h1 className="landing__headline">Buzz ou tendance ?</h1>
        <p className="landing__lead">
          Anticipez buzz et tendances durables pour les Consumer Market Insights
          — avant qu&apos;elles ne s&apos;ancrent dans le quotidien.
        </p>

        <div
          className="landing__cta"
          role="group"
          aria-label="Choisir un départ"
        >
          <button
            type="button"
            className="landing__btn landing__btn--primary"
            onClick={() => navigate('/explorer?assistant=1')}
          >
            Nouvelle recherche
          </button>
          <button
            type="button"
            className="landing__btn landing__btn--ghost"
            onClick={() => navigate('/explorer')}
          >
            Explorer les tendances
          </button>
        </div>
      </div>
    </main>
  );
}
