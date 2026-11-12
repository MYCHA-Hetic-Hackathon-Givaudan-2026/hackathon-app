import { useEffect, useState } from 'react';
import { AssistantPanel } from '../components/AssistantPanel';
import { FiltersBar } from '../components/FiltersBar';
import { FollowMenu } from '../components/FollowMenu';
import { GlobeCanvas } from '../components/GlobeCanvas';
import { Header } from '../components/Header';
import { SignalReport } from '../components/SignalReport';
import { fetchSignaux, type Fenetre, type Signal } from '../lib/signaux';
import {
  createSuivi,
  deleteSuivi,
  fetchSuivis,
  type Suivi,
} from '../lib/suivis';

/** Décale le globe quand le panneau rapport est ouvert (mockup TrendRadar). */
const GLOBE_SHIFT_X = -150;

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
  const [suivis, setSuivis] = useState<Suivi[]>([]);
  const [followMenuOpen, setFollowMenuOpen] = useState(false);
  const [followBusyId, setFollowBusyId] = useState<number | null>(null);
  const [followError, setFollowError] = useState<string | null>(null);

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

  useEffect(() => {
    const ac = new AbortController();
    fetchSuivis(ac.signal)
      .then((rows) => setSuivis(rows))
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        setFollowError(
          err instanceof Error
            ? err.message
            : 'Chargement des suivis impossible',
        );
      });
    return () => ac.abort();
  }, []);

  const visible = signaux.filter((s) =>
    s.profil === 'durable' ? showDurable : showBuzz,
  );
  const countDurable = visible.filter((s) => s.profil === 'durable').length;
  const countBuzz = visible.filter((s) => s.profil === 'buzz').length;

  useEffect(() => {
    if (selectedId == null) return;
    const inList = signaux.some((s) => {
      if (s.id !== selectedId) return false;
      return s.profil === 'durable' ? showDurable : showBuzz;
    });
    const followed = suivis.some((s) => s.signal_id === selectedId);
    if (!inList && !followed) setSelectedId(null);
  }, [signaux, selectedId, showDurable, showBuzz, suivis]);

  const markers = visible.map((s) => ({
    id: s.id,
    nom: s.nom,
    profil: s.profil,
    confiance_pct: s.confiance_pct,
    lat: Number(s.lat),
    lon: Number(s.lon),
  }));

  const selected =
    selectedId == null
      ? null
      : (visible.find((s) => s.id === selectedId) ??
        suivis.find((s) => s.signal_id === selectedId)?.signal ??
        null);
  const reportOpen = selected != null;
  const selectedSuivi =
    selectedId == null
      ? undefined
      : suivis.find((s) => s.signal_id === selectedId);

  async function toggleFollow(signalId: number) {
    const existing = suivis.find((s) => s.signal_id === signalId);
    setFollowBusyId(signalId);
    setFollowError(null);
    try {
      if (existing) {
        await deleteSuivi(existing.id);
        setSuivis((prev) => prev.filter((s) => s.id !== existing.id));
      } else {
        const created = await createSuivi(signalId);
        setSuivis((prev) => [
          created,
          ...prev.filter((s) => s.id !== created.id),
        ]);
      }
    } catch (err: unknown) {
      setFollowError(
        err instanceof Error ? err.message : 'Action suivi impossible',
      );
    } finally {
      setFollowBusyId(null);
    }
  }

  return (
    <div className="explorer">
      <Header
        followCount={suivis.length}
        onOpenFollows={() => setFollowMenuOpen(true)}
      />
      <FollowMenu
        open={followMenuOpen}
        suivis={suivis}
        onClose={() => setFollowMenuOpen(false)}
        onPick={(id) => {
          if (!showDurable || !showBuzz) {
            const fromSuivi = suivis.find((s) => s.signal_id === id)?.signal;
            if (fromSuivi?.profil === 'durable') setShowDurable(true);
            if (fromSuivi?.profil === 'buzz') setShowBuzz(true);
          }
          setSelectedId(id);
        }}
      />
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
          <div
            className={
              reportOpen
                ? 'map-zone__stage map-zone__stage--report'
                : 'map-zone__stage'
            }
          >
            <GlobeCanvas
              markers={markers}
              selectedId={selectedId}
              query={query}
              onSelect={setSelectedId}
              shiftX={reportOpen ? GLOBE_SHIFT_X : 0}
            />
            {loadError ? (
              <p className="map-zone__error" role="alert">
                {loadError}
              </p>
            ) : null}
            {followError ? (
              <p
                className="map-zone__error map-zone__error--follow"
                role="alert"
              >
                {followError}
              </p>
            ) : null}
            {selected ? (
              <SignalReport
                key={selected.id}
                signal={selected}
                followed={selectedSuivi != null}
                followBusy={followBusyId === selected.id}
                onToggleFollow={() => void toggleFollow(selected.id)}
                onClose={() => setSelectedId(null)}
              />
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
