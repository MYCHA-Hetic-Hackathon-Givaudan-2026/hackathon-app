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

export type SignalSource = {
  label: string;
  url: string;
};

export type SignalDetail = Signal & {
  sources: SignalSource[];
};

const MOIS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
] as const;

/** Formate un mois YYYYMM (ex. `202403` → `mars 2024`). */
export function formatYm(ym: string): string {
  if (!/^\d{6}$/.test(ym)) return ym;
  const month = Number(ym.slice(4)) - 1;
  if (month < 0 || month > 11) return ym;
  return `${MOIS[month]} ${ym.slice(0, 4)}`;
}

export type SignauxQuery = {
  min_confiance?: number;
  q?: string;
  fenetre?: Fenetre | null;
  profil?: SignalProfil;
};

async function readApiError(res: Response): Promise<string> {
  const body: unknown = await res.json().catch(() => null);
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    typeof (body as { error: unknown }).error === 'string'
  ) {
    return (body as { error: string }).error;
  }
  return `HTTP ${res.status}`;
}

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
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Signal[];
}

export async function fetchSignal(
  id: number,
  signal?: AbortSignal,
): Promise<SignalDetail> {
  const res = await fetch(`/api/signaux/${id}`, { signal });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as SignalDetail;
}
