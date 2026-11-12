import { useEffect, useState } from 'react';
import { AssistantPanel } from '../components/AssistantPanel';
import { FiltersBar } from '../components/FiltersBar';
import { GlobeCanvas } from '../components/GlobeCanvas';
import { Header } from '../components/Header';
import { fetchSignaux, type Fenetre, type Signal } from '../lib/signaux';

type ExplorerPageProps = {
  /** Depuis la landing « Nouvelle recherche » : focus l’input assistant. */
  focusAssistant?: boolean;
};

export function ExplorerPage({ focusAssistant = false }: ExplorerPageProps) {
  const [signaux, setSignaux] = useState<Signal[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDurable, setShowDurable] = useState(true);
  const [showBuzz, setShowBuzz] = useState(true);
  const [minConfiance, setMinConfiance] = useState(50);
  const [fenetre, setFenetre] = useState<Fenetre | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const ac = new AbortController();
    setLoadError(null);
    fetchSignaux(
      {
        min_confiance: minConfiance,
        q: debouncedQuery || undefined,
        fenetre,
      },
      ac.signal,
    )
      .then((rows) => {
        setSignaux(rows);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        setSignaux([]);
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Chargement des signaux impossible',
        );
      });
    return () => ac.abort();
  }, [minConfiance, debouncedQuery, fenetre]);

  const visible = signaux.filter((s) =>
    s.profil === 'durable' ? showDurable : showBuzz,
  );
  const countDurable = visible.filter((s) => s.profil === 'durable').length;
  const countBuzz = visible.filter((s) => s.profil === 'buzz').length;

  useEffect(() => {
    if (selectedId == null) return;
    const stillVisible = signaux.some((s) => {
      if (s.id !== selectedId) return false;
      return s.profil === 'durable' ? showDurable : showBuzz;
    });
    if (!stillVisible) setSelectedId(null);
  }, [signaux, selectedId, showDurable, showBuzz]);

  const markers = visible.map((s) => ({
    id: s.id,
    nom: s.nom,
    profil: s.profil,
    confiance_pct: s.confiance_pct,
    lat: Number(s.lat),
    lon: Number(s.lon),
  }));

  return (
    <div className="explorer">
      <Header />
      <div className="explorer__body">
        <AssistantPanel focusOnMount={focusAssistant} />
        <section className="map-zone" aria-label="Carte des signaux">
          <FiltersBar
            query={query}
            onQueryChange={setQuery}
            showDurable={showDurable}
            showBuzz={showBuzz}
            onToggleDurable={() => setShowDurable((v) => !v)}
            onToggleBuzz={() => setShowBuzz((v) => !v)}
            countDurable={countDurable}
            countBuzz={countBuzz}
            minConfiance={minConfiance}
            onMinConfianceChange={setMinConfiance}
            fenetre={fenetre}
            onFenetreChange={setFenetre}
          />
          <div className="map-zone__stage">
            <GlobeCanvas
              markers={markers}
              selectedId={selectedId}
              query={query}
              onSelect={setSelectedId}
            />
            {loadError ? (
              <p className="map-zone__error" role="alert">
                {loadError}
              </p>
            ) : null}
            <div className="map-zone__legend">
              <div className="map-zone__legend-row">
                <span className="map-zone__dot" aria-hidden="true" />
                Tendance durable
              </div>
              <div className="map-zone__legend-row">
                <span className="map-zone__diamond" aria-hidden="true" />
                Buzz
              </div>
              <div className="map-zone__legend-row">Taille = confiance</div>
            </div>
            <p className="map-zone__hint">
              Glisser pour tourner · molette pour zoomer · clic sur un signal
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
