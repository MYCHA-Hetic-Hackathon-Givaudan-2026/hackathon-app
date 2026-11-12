import { useEffect, useRef, useState } from 'react';
import { AssistantPanel } from '../components/AssistantPanel';
import { FiltersBar } from '../components/FiltersBar';
import { FollowMenu } from '../components/FollowMenu';
import { GlobeCanvas } from '../components/GlobeCanvas';
import { Header } from '../components/Header';
import { SignalReport } from '../components/SignalReport';
import { useTheme } from '../hooks/useTheme';
import { drawOrb } from '../lib/globe/drawOrb';
import { fetchSignaux, type Fenetre, type Signal } from '../lib/signaux';
import {
  createSuivi,
  deleteSuivi,
  fetchSuivis,
  type Suivi,
} from '../lib/suivis';

/** Décale le globe quand le panneau rapport est ouvert. */
const GLOBE_SHIFT_X = -120;

type ExplorerPageProps = {
  focusAssistant?: boolean;
};

export function ExplorerPage({ focusAssistant = false }: ExplorerPageProps) {
  const { theme, toggleTheme } = useTheme();
  const [signaux, setSignaux] = useState<Signal[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDurable, setShowDurable] = useState(true);
  const [showBuzz, setShowBuzz] = useState(true);
  const [minConfiance, setMinConfiance] = useState(50);
  const [fenetre, setFenetre] = useState<Fenetre | null>(null);
  const [domaine, setDomaine] = useState<'all' | 'gout' | 'parfum'>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [suivis, setSuivis] = useState<Suivi[]>([]);
  const [followMenuOpen, setFollowMenuOpen] = useState(false);
  const [followBusyId, setFollowBusyId] = useState<number | null>(null);
  const [followError, setFollowError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [toast, setToast] = useState('');
  const orbRef = useRef<HTMLCanvasElement>(null);
  const toastTimer = useRef<number | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2800);
  }

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

  useEffect(() => {
    if (chatOpen) return;
    const canvas = orbRef.current;
    if (!canvas) return;
    let raf = 0;
    const tick = (now: number) => {
      drawOrb(canvas, now / 1000, { size: 92 });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [chatOpen]);

  const byDomaine = signaux.filter((s) => {
    if (domaine === 'gout') return s.domaine !== 'Parfum';
    if (domaine === 'parfum') return s.domaine === 'Parfum';
    return true;
  });

  const visible = byDomaine.filter((s) =>
    s.profil === 'durable' ? showDurable : showBuzz,
  );
  const countDurable = byDomaine.filter((s) => s.profil === 'durable').length;
  const countBuzz = byDomaine.filter((s) => s.profil === 'buzz').length;
  const countGout = signaux.filter((s) => s.domaine !== 'Parfum').length;
  const countParfum = signaux.filter((s) => s.domaine === 'Parfum').length;

  useEffect(() => {
    if (selectedId == null) return;
    const inList = visible.some((s) => s.id === selectedId);
    const followed = suivis.some((s) => s.signal_id === selectedId);
    if (!inList && !followed) setSelectedId(null);
  }, [visible, selectedId, suivis]);

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
        query={query}
        onQueryChange={setQuery}
        theme={theme}
        onToggleTheme={toggleTheme}
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
      <div
        className={
          chatOpen ? 'explorer__body' : 'explorer__body explorer__body--wide'
        }
      >
        <AssistantPanel
          focusOnMount={focusAssistant}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />
        <main className="map-zone" aria-label="Carte des signaux">
          <div className="map-zone__intro">
            <p className="map-zone__eyebrow">Explorer</p>
            <h1 className="map-zone__title">Buzz ou tendance ?</h1>
            <p className="map-zone__lead">
              Cliquez sur un signal pour savoir s&apos;il va durer.
            </p>
          </div>

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
              signalById={(id) => {
                const fromList = signaux.find((s) => s.id === id);
                if (fromList) {
                  return {
                    nom: fromList.nom,
                    profil: fromList.profil,
                    confiance_pct: fromList.confiance_pct,
                    famille: fromList.famille,
                    pays: fromList.pays,
                  };
                }
                const fromSuivi = suivis.find(
                  (s) => s.signal_id === id,
                )?.signal;
                if (!fromSuivi) return null;
                return {
                  nom: fromSuivi.nom,
                  profil: fromSuivi.profil,
                  confiance_pct: fromSuivi.confiance_pct,
                  famille: fromSuivi.famille,
                  pays: fromSuivi.pays,
                };
              }}
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

            <FiltersBar
              showDurable={showDurable}
              showBuzz={showBuzz}
              onToggleDurable={() =>
                setShowDurable((v) => (v && !showBuzz ? v : !v))
              }
              onToggleBuzz={() =>
                setShowBuzz((v) => (v && !showDurable ? v : !v))
              }
              countDurable={countDurable}
              countBuzz={countBuzz}
              minConfiance={minConfiance}
              onMinConfianceChange={setMinConfiance}
              fenetre={fenetre}
              onFenetreChange={setFenetre}
              domaine={domaine}
              onDomaineChange={setDomaine}
              countGout={countGout}
              countParfum={countParfum}
            />

            {!chatOpen ? (
              <button
                type="button"
                className="map-zone__astra"
                onClick={() => setChatOpen(true)}
                aria-label="Afficher ASTRA"
              >
                <canvas
                  ref={orbRef}
                  width={92}
                  height={92}
                  aria-hidden="true"
                />
                <span>ASTRA</span>
              </button>
            ) : null}

            {selected ? (
              <SignalReport
                key={selected.id}
                signal={selected}
                followed={selectedSuivi != null}
                followBusy={followBusyId === selected.id}
                onToggleFollow={() => void toggleFollow(selected.id)}
                onClose={() => setSelectedId(null)}
                onToast={showToast}
                onAskVeille={(nom) => {
                  setChatOpen(true);
                  showToast(
                    `Demandez à ASTRA : « Fais une veille sur ${nom} »`,
                  );
                }}
              />
            ) : null}

            {toast ? (
              <div className="map-zone__toast" role="status">
                {toast}
              </div>
            ) : null}
          </div>

          <div className="map-zone__footer">
            <span>
              <strong>{visible.length}</strong> signaux affichés
            </span>
            <span>
              Glisser pour tourner · cliquer un groupe pour zoomer · molette
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
