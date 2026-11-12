import type { Signal } from './signaux';

export type Suivi = {
  id: number;
  signal_id: number;
  created_at: string;
  signal: Signal;
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

export async function fetchSuivis(signal?: AbortSignal): Promise<Suivi[]> {
  const res = await fetch('/api/suivis', { signal });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Suivi[];
}

export async function createSuivi(signalId: number): Promise<Suivi> {
  const res = await fetch('/api/suivis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signal_id: signalId }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Suivi;
}

export async function deleteSuivi(id: number): Promise<void> {
  const res = await fetch(`/api/suivis/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await readApiError(res));
}
