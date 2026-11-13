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
  createVeille,
  deleteSuivi,
  fetchSuivis,
  fetchVeilles,
  type AgentAction,
  type Suivi,
  type Veille,
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
  const [veilleBusyId, setVeilleBusyId] = useState<number | null>(null);
  const [veillesBySuivi, setVeillesBySuivi] = useState<
    Record<number, Veille[]>
  >({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

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

  useEffect(() => {
    if (!selectedSuivi) return;
    if (!selectedSuivi.has_veille) return;
    if (veillesBySuivi[selectedSuivi.id]) return;
    const ac = new AbortController();
    fetchVeilles(selectedSuivi.id, ac.signal)
      .then((rows) => {
        setVeillesBySuivi((prev) => ({ ...prev, [selectedSuivi.id]: rows }));
      })
      .catch(() => {
        /* historique optionnel à l'affichage */
      });
    return () => ac.abort();
  }, [selectedSuivi, veillesBySuivi]);

  function upsertSuivi(row: Suivi) {
    setSuivis((prev) => [row, ...prev.filter((s) => s.id !== row.id)]);
  }

  async function toggleFollow(signalId: number) {
    const existing = suivis.find((s) => s.signal_id === signalId);
    setFollowBusyId(signalId);
    setFollowError(null);
    try {
      if (existing) {
        await deleteSuivi(existing.id);
        setSuivis((prev) => prev.filter((s) => s.id !== existing.id));
        setVeillesBySuivi((prev) => {
          const next = { ...prev };
          delete next[existing.id];
          return next;
        });
      } else {
        const created = await createSuivi(signalId);
        upsertSuivi(created);
      }
    } catch (err: unknown) {
      setFollowError(
        err instanceof Error ? err.message : 'Action suivi impossible',
      );
    } finally {
      setFollowBusyId(null);
    }
  }

  async function activateVeille(signalId: number) {
    setVeilleBusyId(signalId);
    setFollowError(null);
    try {
      let suivi = suivis.find((s) => s.signal_id === signalId);
      if (!suivi) {
        suivi = await createSuivi(signalId);
        upsertSuivi(suivi);
      }
      const veille = await createVeille(suivi.id);
      upsertSuivi({ ...suivi, has_veille: true });
      setVeillesBySuivi((prev) => ({
        ...prev,
        [suivi.id]: [veille, ...(prev[suivi.id] ?? [])],
      }));
      const nom =
        suivi.signal.nom ??
        signaux.find((s) => s.id === signalId)?.nom ??
        'signal';
      setToast(`Veille activée · ${nom}`);
      setSelectedId(signalId);
    } catch (err: unknown) {
      setFollowError(
        err instanceof Error ? err.message : 'Veille IA impossible',
      );
    } finally {
      setVeilleBusyId(null);
    }
  }

  function handleAgentAction(action: AgentAction) {
    if (action.signal_id != null) {
      const fromList = signaux.find((s) => s.id === action.signal_id);
      const fromSuivi = suivis.find(
        (s) => s.signal_id === action.signal_id,
      )?.signal;
      const profil = fromList?.profil ?? fromSuivi?.profil;
      if (profil === 'durable') setShowDurable(true);
      if (profil === 'buzz') setShowBuzz(true);
      setSelectedId(action.signal_id);
    }
    if (action.type === 'veille' && action.suivi_id != null) {
      const signalId = action.signal_id;
      setSuivis((prev) => {
        const existing = prev.find((s) => s.id === action.suivi_id);
        if (existing) {
          return prev.map((s) =>
            s.id === action.suivi_id ? { ...s, has_veille: true } : s,
          );
        }
        if (signalId == null) return prev;
        void fetchSuivis()
          .then(setSuivis)
          .catch(() => undefined);
        return prev;
      });
      if (action.veille) {
        setVeillesBySuivi((prev) => ({
          ...prev,
          [action.suivi_id!]: [
            action.veille!,
            ...(prev[action.suivi_id!] ?? []),
          ],
        }));
      }
      const nom =
        signaux.find((s) => s.id === signalId)?.nom ??
        suivis.find((s) => s.signal_id === signalId)?.signal.nom;
      if (nom) setToast(`Veille activée · ${nom}`);
    }
    if (action.type === 'follow') {
      void fetchSuivis()
        .then(setSuivis)
        .catch(() => undefined);
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
      <div className="explorer__body">
        <AssistantPanel
          focusOnMount={focusAssistant}
          selectedSignalId={selectedId}
          selectedSignalName={selected?.nom ?? null}
          onAction={handleAgentAction}
        />
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
                hasVeille={selectedSuivi?.has_veille === true}
                followBusy={followBusyId === selected.id}
                veilleBusy={veilleBusyId === selected.id}
                veilles={
                  selectedSuivi ? (veillesBySuivi[selectedSuivi.id] ?? []) : []
                }
                onToggleFollow={() => void toggleFollow(selected.id)}
                onActivateVeille={() => void activateVeille(selected.id)}
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
      {toast ? (
        <div className="explorer-toast" role="status">
          <span className="explorer-toast__dot" aria-hidden="true" />
          {toast}
        </div>
      ) : null}
    </div>
  );
}
