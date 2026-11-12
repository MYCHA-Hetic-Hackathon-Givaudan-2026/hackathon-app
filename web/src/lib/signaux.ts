export type SignalProfil = 'durable' | 'buzz';

export type Fenetre = '7d' | '30d' | '90d';

export type Signal = {
  id: number;
  nom: string;
  famille: string;
  domaine: string;
  profil: SignalProfil;
  confiance_pct: number;
  croissance_pct: number | null;
  statut_data: string | null;
  cc: string;
  pays: string;
  lat: number;
  lon: number;
  ce_qui_plait: string;
  veille_resume: string;
  matieres: string[];
  decollage: string;
  predit_en: string;
  verifiable_en: string;
  created_at: string;
};

export type SignauxQuery = {
  min_confiance?: number;
  q?: string;
  fenetre?: Fenetre | null;
  profil?: SignalProfil;
};

export async function fetchSignaux(
  query: SignauxQuery = {},
  signal?: AbortSignal,
): Promise<Signal[]> {
  const params = new URLSearchParams();
  const min = query.min_confiance ?? 50;
  params.set('min_confiance', String(min));
  const q = query.q?.trim();
  if (q) params.set('q', q);
  if (query.fenetre) params.set('fenetre', query.fenetre);
  if (query.profil) params.set('profil', query.profil);

  const res = await fetch(`/api/signaux?${params}`, { signal });
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    const msg =
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return (await res.json()) as Signal[];
}
