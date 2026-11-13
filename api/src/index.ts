import express from 'express';
import pg from 'pg';

// En dev, la configuration vient de api/.env ; en production, de l'hébergeur
try {
  process.loadEnvFile();
} catch {
  // Pas de .env : on garde l'environnement tel quel
}

const { DATABASE_URL, AI_BASE_URL, AI_MODEL, AI_API_KEY = '' } = process.env;
// Base de l'API Data (Swagger sur /docs). Contrat : docs/data/openapi.json
const { DATA_AI_URL } = process.env;
const PORT = Number(process.env.PORT ?? 3000);

const db = new pg.Pool({ connectionString: DATABASE_URL });
const app = express();
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const { rows } = await db.query('SELECT version()');
  res.json({ status: 'ok', db: rows[0].version });
});

app.get('/api/questions', async (_req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM questions ORDER BY id DESC LIMIT 10',
  );
  res.json(rows);
});

app.post('/api/questions', async (req, res) => {
  const question = String(req.body?.question ?? '').trim();
  if (!question) {
    res.status(400).json({ error: 'Question manquante' });
    return;
  }

  try {
    const answer = await ask(question);
    const { rows } = await db.query(
      'INSERT INTO questions (question, answer) VALUES ($1, $2) RETURNING *',
      [question, answer],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    const status = aiErrorStatus(error);
    const message = error instanceof Error ? error.message : 'IA indisponible';
    res.status(status).json({ error: message });
  }
});

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiConfigError';
  }
}

function aiErrorStatus(error: unknown): 502 | 503 {
  return error instanceof AiConfigError ? 503 : 502;
}

// Même appel pour Ollama, Mistral, OpenAI… : seule la configuration change
async function ask(question: string, system?: string): Promise<string> {
  if (!AI_BASE_URL || !AI_MODEL) {
    throw new AiConfigError('IA non configurée (AI_BASE_URL)');
  }
  const messages: ChatMessage[] = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: question });

  let response: Response;
  try {
    response = await fetch(
      `${AI_BASE_URL.replace(/\/$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages,
          max_tokens: 220,
          temperature: 0.3,
        }),
        // Ollama local peut dépasser 2 min sur machine contrainte.
        signal: AbortSignal.timeout(300_000),
      },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'fetch failed';
    throw new Error(`IA : ${detail}`, { cause: error });
  }
  if (!response.ok) {
    throw new Error(`IA : ${response.status} ${await response.text()}`);
  }
  const data: unknown = await response.json();
  const content =
    data &&
    typeof data === 'object' &&
    'choices' in data &&
    Array.isArray((data as { choices: unknown }).choices)
      ? (data as { choices: { message?: { content?: unknown } }[] }).choices[0]
          ?.message?.content
      : undefined;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('IA : réponse inattendue');
  }
  return content.trim();
}

// Contrat Data : docs/data/openapi.json (malickl/trend-radar). Pas de /tendances.
function dataBaseUrl(): string {
  if (!DATA_AI_URL) {
    throw new Error('API Data non configurée (DATA_AI_URL)');
  }
  return DATA_AI_URL.replace(/\/$/, '');
}

function dataHeaders(json = false): HeadersInit {
  const headers: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
  };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

type DataProxyResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; error: string };

async function proxyData(
  path: string,
  init: RequestInit = {},
): Promise<DataProxyResult> {
  const response = await fetch(`${dataBaseUrl()}${path}`, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(30_000),
  });
  if (response.status === 204) {
    return { ok: true, status: 204, body: null };
  }
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: await (async () => {
        if (typeof body === 'object' && body) {
          if (
            'detail' in body &&
            typeof (body as { detail: unknown }).detail === 'string'
          ) {
            return (body as { detail: string }).detail;
          }
        }
        return typeof body === 'string' && body.trim()
          ? body.trim()
          : `Data : ${response.status}`;
      })(),
    };
  }
  return { ok: true, status: response.status, body };
}

function sendDataProxy(
  res: express.Response,
  result: DataProxyResult,
  unexpected?: (body: unknown) => string | null,
): void {
  if (!result.ok) {
    const status =
      result.status === 404 || result.status === 409 || result.status === 422
        ? result.status
        : 502;
    res.status(status).json({ error: result.error });
    return;
  }
  const bad = unexpected?.(result.body) ?? null;
  if (bad) {
    res.status(502).json({ error: bad });
    return;
  }
  res.status(result.status).json(result.body);
}

app.get('/api/data/health', async (_req, res) => {
  if (!DATA_AI_URL) {
    res.status(503).json({ error: 'API Data non configurée (DATA_AI_URL)' });
    return;
  }
  try {
    sendDataProxy(
      res,
      await proxyData('/health', { headers: dataHeaders() }),
      (body) =>
        body &&
        typeof body === 'object' &&
        'status' in body &&
        (body as { status: unknown }).status === 'ok'
          ? null
          : 'Data : réponse health inattendue',
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'API Data indisponible';
    res.status(502).json({ error: message });
  }
});

app.get('/api/scan/latest', async (_req, res) => {
  if (!DATA_AI_URL) {
    res.status(503).json({ error: 'API Data non configurée (DATA_AI_URL)' });
    return;
  }
  try {
    sendDataProxy(
      res,
      await proxyData('/scan/latest', { headers: dataHeaders() }),
      (body) =>
        body &&
        typeof body === 'object' &&
        'rows' in body &&
        Array.isArray((body as { rows: unknown }).rows)
          ? null
          : 'Data : réponse scan/latest inattendue',
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'API Data indisponible';
    res.status(502).json({ error: message });
  }
});

app.get('/api/scan/status', async (_req, res) => {
  if (!DATA_AI_URL) {
    res.status(503).json({ error: 'API Data non configurée (DATA_AI_URL)' });
    return;
  }
  try {
    sendDataProxy(
      res,
      await proxyData('/scan/status', { headers: dataHeaders() }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'API Data indisponible';
    res.status(502).json({ error: message });
  }
});

app.post('/api/predict', async (req, res) => {
  if (!DATA_AI_URL) {
    res.status(503).json({ error: 'API Data non configurée (DATA_AI_URL)' });
    return;
  }
  const title = String(req.body?.title ?? '').trim();
  if (!title) {
    res.status(400).json({ error: 'title manquant' });
    return;
  }
  const params = new URLSearchParams();
  for (const key of ['last', 'since'] as const) {
    const value = req.query[key];
    if (typeof value === 'string' && value.trim()) {
      params.set(key, value.trim());
    }
  }
  const qs = params.toString();
  const path = qs ? `/predict?${qs}` : '/predict';
  try {
    sendDataProxy(
      res,
      await proxyData(path, {
        method: 'POST',
        headers: dataHeaders(true),
        body: JSON.stringify(req.body),
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'API Data indisponible';
    res.status(502).json({ error: message });
  }
});

type SignalRow = {
  id: number;
  nom: string;
  famille: string;
  domaine: string;
  profil: 'durable' | 'buzz';
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
  created_at: Date;
};

type SignalSource = { label: string; url: string };

const FENETRE_JOURS = { '7d': 7, '30d': 30, '90d': 90 } as const;

function sourcesFor(nom: string): SignalSource[] {
  const enc = encodeURIComponent(nom);
  const wiki = encodeURIComponent(nom.replace(/ /g, '_'));
  return [
    {
      label: `Wikipédia : ${nom}`,
      url: `https://en.wikipedia.org/wiki/${wiki}`,
    },
    {
      label: 'Google Trends : intérêt de recherche',
      url: `https://trends.google.com/trends/explore?date=today%2012-m&q=${enc}`,
    },
    {
      label: 'Google Actualités : articles récents',
      url: `https://news.google.com/search?q=${enc}`,
    },
  ];
}

app.get('/api/signaux', async (req, res) => {
  const profil =
    req.query.profil === undefined ? undefined : String(req.query.profil);
  if (profil !== undefined && profil !== 'durable' && profil !== 'buzz') {
    res.status(400).json({ error: 'profil invalide (durable|buzz)' });
    return;
  }

  const minRaw = req.query.min_confiance;
  const min_confiance =
    minRaw === undefined || minRaw === '' ? 50 : Number(minRaw);
  if (
    !Number.isInteger(min_confiance) ||
    min_confiance < 50 ||
    min_confiance > 100
  ) {
    res.status(400).json({ error: 'min_confiance invalide (50–100)' });
    return;
  }

  const fenetre =
    req.query.fenetre === undefined || req.query.fenetre === ''
      ? undefined
      : String(req.query.fenetre);
  if (
    fenetre !== undefined &&
    fenetre !== '7d' &&
    fenetre !== '30d' &&
    fenetre !== '90d'
  ) {
    res.status(400).json({ error: 'fenetre invalide (7d|30d|90d)' });
    return;
  }

  const q = String(req.query.q ?? '').trim();
  const clauses = ['confiance_pct >= $1'];
  const params: unknown[] = [min_confiance];

  if (profil === 'durable' || profil === 'buzz') {
    params.push(profil);
    clauses.push(`profil = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    clauses.push(`nom ILIKE $${params.length}`);
  }
  if (fenetre === '7d' || fenetre === '30d' || fenetre === '90d') {
    params.push(FENETRE_JOURS[fenetre]);
    clauses.push(
      `to_date(decollage || '01', 'YYYYMMDD') >= (CURRENT_DATE - ($${params.length}::text || ' days')::interval)`,
    );
  }

  const { rows } = await db.query<SignalRow>(
    `SELECT * FROM signaux WHERE ${clauses.join(' AND ')} ORDER BY confiance_pct DESC, id`,
    params,
  );
  res.json(rows);
});

app.get('/api/signaux/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'id invalide' });
    return;
  }
  const { rows } = await db.query<SignalRow>(
    'SELECT * FROM signaux WHERE id = $1',
    [id],
  );
  if (rows.length === 0) {
    res.status(404).json({ error: 'Signal introuvable' });
    return;
  }
  const signal = rows[0];
  res.json({ ...signal, sources: sourcesFor(signal.nom) });
});

type SuiviRow = {
  id: number;
  signal_id: number;
  created_at: Date;
};

type VeilleRow = {
  id: number;
  suivi_id: number;
  texte: string;
  created_at: Date;
};

const SUIVI_SELECT = `
  SELECT
    s.id,
    s.signal_id,
    s.created_at,
    EXISTS (
      SELECT 1 FROM veilles v WHERE v.suivi_id = s.id
    ) AS has_veille,
    to_jsonb(sig) AS signal
  FROM suivis s
  JOIN signaux sig ON sig.id = s.signal_id
`;

const AGENT_SYSTEM = `Tu es TrendRadar, assistant CMI Givaudan.
Réponds en français, de façon courte et concrète (2 à 4 phrases).
Tu aides à explorer des signaux de tendance (goût, texture, format, occasion).
N'invente pas de scores numériques hors contexte fourni.`;

const VEILLE_SYSTEM = `Analyste veille CMI TrendRadar. Note courte en français (3-5 phrases), sans markdown.`;

function parsePositiveId(raw: unknown): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id >= 1 ? id : null;
}

async function getSuiviById(id: number) {
  const { rows } = await db.query(`${SUIVI_SELECT} WHERE s.id = $1`, [id]);
  return rows[0] as
    | {
        id: number;
        signal_id: number;
        created_at: Date;
        has_veille: boolean;
        signal: SignalRow;
      }
    | undefined;
}

async function ensureSuiviForSignal(signalId: number) {
  const existing = await db.query(`${SUIVI_SELECT} WHERE s.signal_id = $1`, [
    signalId,
  ]);
  if (existing.rows[0])
    return existing.rows[0] as Awaited<ReturnType<typeof getSuiviById>>;

  const signal = await db.query<SignalRow>(
    'SELECT id FROM signaux WHERE id = $1',
    [signalId],
  );
  if (signal.rows.length === 0) return undefined;

  const inserted = await db.query<SuiviRow>(
    'INSERT INTO suivis (signal_id) VALUES ($1) RETURNING id, signal_id, created_at',
    [signalId],
  );
  return getSuiviById(inserted.rows[0].id);
}

async function createVeilleForSuivi(
  suivi: NonNullable<Awaited<ReturnType<typeof getSuiviById>>>,
): Promise<VeilleRow> {
  const sig = suivi.signal;
  const matieres = Array.isArray(sig.matieres)
    ? sig.matieres.slice(0, 4).join(', ')
    : '';
  const prompt = `Veille du jour sur « ${sig.nom} » (${sig.famille}, ${sig.pays}, profil ${sig.profil}, confiance ${sig.confiance_pct}%). Angle : ${sig.ce_qui_plait}. Matières : ${matieres}.`;
  const texte = await ask(prompt, VEILLE_SYSTEM);
  const { rows } = await db.query<VeilleRow>(
    `INSERT INTO veilles (suivi_id, texte)
     VALUES ($1, $2)
     RETURNING id, suivi_id, texte, created_at`,
    [suivi.id, texte],
  );
  return rows[0];
}

app.get('/api/suivis', async (_req, res) => {
  const { rows } = await db.query(
    `${SUIVI_SELECT} ORDER BY s.created_at DESC, s.id DESC`,
  );
  res.json(rows);
});

app.post('/api/suivis', async (req, res) => {
  const signal_id = parsePositiveId(req.body?.signal_id);
  if (signal_id == null) {
    res.status(400).json({ error: 'signal_id manquant' });
    return;
  }

  const existing = await db.query<SignalRow>(
    'SELECT id FROM signaux WHERE id = $1',
    [signal_id],
  );
  if (existing.rows.length === 0) {
    res.status(404).json({ error: 'Signal introuvable' });
    return;
  }

  try {
    const inserted = await db.query<SuiviRow>(
      'INSERT INTO suivis (signal_id) VALUES ($1) RETURNING id, signal_id, created_at',
      [signal_id],
    );
    const row = await getSuiviById(inserted.rows[0].id);
    res.status(201).json(row);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    ) {
      res.status(409).json({ error: 'Signal déjà suivi' });
      return;
    }
    throw error;
  }
});

app.delete('/api/suivis/:id', async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) {
    res.status(400).json({ error: 'id invalide' });
    return;
  }
  const { rowCount } = await db.query('DELETE FROM suivis WHERE id = $1', [id]);
  if (!rowCount) {
    res.status(404).json({ error: 'Suivi introuvable' });
    return;
  }
  res.status(204).end();
});

app.post('/api/suivis/:id/veille', async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) {
    res.status(400).json({ error: 'id invalide' });
    return;
  }
  const suivi = await getSuiviById(id);
  if (!suivi) {
    res.status(404).json({ error: 'Suivi introuvable' });
    return;
  }
  try {
    const veille = await createVeilleForSuivi(suivi);
    res.status(201).json(veille);
  } catch (error) {
    res.status(aiErrorStatus(error)).json({
      error: error instanceof Error ? error.message : 'IA indisponible',
    });
  }
});

app.get('/api/suivis/:id/veilles', async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) {
    res.status(400).json({ error: 'id invalide' });
    return;
  }
  const suivi = await db.query('SELECT id FROM suivis WHERE id = $1', [id]);
  if (suivi.rows.length === 0) {
    res.status(404).json({ error: 'Suivi introuvable' });
    return;
  }
  const { rows } = await db.query<VeilleRow>(
    `SELECT id, suivi_id, texte, created_at
     FROM veilles
     WHERE suivi_id = $1
     ORDER BY created_at DESC, id DESC`,
    [id],
  );
  res.json(rows);
});

app.post('/api/agent/message', async (req, res) => {
  const message = String(req.body?.message ?? '').trim();
  if (!message) {
    res.status(400).json({ error: 'message manquant' });
    return;
  }
  const contextId = parsePositiveId(req.body?.signal_id);

  const { rows: signaux } = await db.query<
    Pick<SignalRow, 'id' | 'nom' | 'profil' | 'confiance_pct'>
  >(
    'SELECT id, nom, profil, confiance_pct FROM signaux ORDER BY length(nom) DESC, id',
  );
  const low = message.toLowerCase();
  const named = signaux.find((s) => low.includes(s.nom.toLowerCase()));
  const targetId = named?.id ?? contextId ?? null;
  const target = targetId ? signaux.find((s) => s.id === targetId) : undefined;
  const wantsVeille = /veille|surveill|suis|suivre|suivi/.test(low);

  try {
    if (wantsVeille) {
      if (!target) {
        res.json({
          reply:
            'Sur quel signal ? Clique sur un point du globe, puis redemande-moi.',
          action: null,
        });
        return;
      }
      const suivi = await ensureSuiviForSignal(target.id);
      if (!suivi) {
        res.status(404).json({ error: 'Signal introuvable' });
        return;
      }
      if (suivi.has_veille) {
        res.json({
          reply: `La veille est déjà active sur ${target.nom}. Je te remonte chaque nouvelle info dès qu’elle paraît.`,
          action: {
            type: 'focus' as const,
            signal_id: target.id,
            suivi_id: suivi.id,
          },
        });
        return;
      }
      const veille = await createVeilleForSuivi(suivi);
      res.json({
        reply: `C’est fait : veille activée sur ${target.nom}. Je surveille articles, lancements de produits et recherches, et je te préviens dès que la tendance bouge.`,
        action: {
          type: 'veille' as const,
          signal_id: target.id,
          suivi_id: suivi.id,
          veille,
        },
      });
      return;
    }

    if (target) {
      const profilLabel =
        target.profil === 'durable' ? 'tendance durable' : 'buzz';
      res.json({
        reply: `${target.nom} : ${profilLabel} selon le modèle, à ${target.confiance_pct} % de confiance. Je l’ai affiché sur le globe.`,
        action: { type: 'focus' as const, signal_id: target.id },
      });
      return;
    }

    const reply = await ask(message, AGENT_SYSTEM);
    res.json({ reply, action: null });
  } catch (error) {
    res.status(aiErrorStatus(error)).json({
      error: error instanceof Error ? error.message : 'IA indisponible',
    });
  }
});

// Sans adresse, Node écoute sur toutes les interfaces : joignable hors du conteneur
app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}`));
