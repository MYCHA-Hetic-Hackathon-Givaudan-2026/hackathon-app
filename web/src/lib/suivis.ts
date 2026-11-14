import type { Signal } from './signaux';

export type Suivi = {
  id: number;
  signal_id: number;
  created_at: string;
  has_veille: boolean;
  signal: Signal;
};

export type Veille = {
  id: number;
  suivi_id: number;
  texte: string;
  created_at: string;
};

export type AgentAction = {
  type: 'focus' | 'follow' | 'veille';
  signal_id?: number;
  suivi_id?: number;
  veille?: Veille;
};

export type AgentMessageResponse = {
  reply: string;
  action?: AgentAction | null;
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

export async function createVeille(suiviId: number): Promise<Veille> {
  const res = await fetch(`/api/suivis/${suiviId}/veille`, { method: 'POST' });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Veille;
}

export async function fetchVeilles(
  suiviId: number,
  signal?: AbortSignal,
): Promise<Veille[]> {
  const res = await fetch(`/api/suivis/${suiviId}/veilles`, { signal });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Veille[];
}

export async function postAgentMessage(
  message: string,
  signalId?: number | null,
): Promise<AgentMessageResponse> {
  const res = await fetch('/api/agent/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      signal_id: signalId ?? null,
    }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as AgentMessageResponse;
}
