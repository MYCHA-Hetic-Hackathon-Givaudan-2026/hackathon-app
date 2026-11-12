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

  const answer = await ask(question);
  const { rows } = await db.query(
    'INSERT INTO questions (question, answer) VALUES ($1, $2) RETURNING *',
    [question, answer],
  );
  res.status(201).json(rows[0]);
});

// Même appel pour Ollama, Mistral, OpenAI… : seule la configuration change
async function ask(question: string): Promise<string> {
  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'user', content: question }],
    }),
  });
  if (!response.ok) {
    throw new Error(`IA : ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

type Tendance = {
  terme: string;
  croissance_pct: number;
  statut: string;
};

app.post('/api/tendances', async (req, res) => {
  if (!DATA_AI_URL) {
    res.status(503).json({ error: 'API Data non configurée (DATA_AI_URL)' });
    return;
  }
  const termes = Array.isArray(req.body?.termes)
    ? req.body.termes
        .map((terme: unknown) => String(terme).trim())
        .filter(Boolean)
    : [];
  if (termes.length === 0) {
    res.status(400).json({ error: 'termes manquants' });
    return;
  }

  try {
    res.json(await fetchTendances(termes));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'API Data indisponible';
    res.status(502).json({ error: message });
  }
});

// Contrat Data : POST /tendances, voir docs/data/openapi.json (leur Swagger /docs)
async function fetchTendances(termes: string[]): Promise<Tendance[]> {
  if (!DATA_AI_URL) {
    throw new Error('API Data non configurée (DATA_AI_URL)');
  }
  const response = await fetch(`${DATA_AI_URL.replace(/\/$/, '')}/tendances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ termes }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`Data : ${response.status} ${await response.text()}`);
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Data : réponse inattendue');
  }
  return data as Tendance[];
}

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

const SUIVI_SELECT = `
  SELECT
    s.id,
    s.signal_id,
    s.created_at,
    to_jsonb(sig) AS signal
  FROM suivis s
  JOIN signaux sig ON sig.id = s.signal_id
`;

app.get('/api/suivis', async (_req, res) => {
  const { rows } = await db.query(
    `${SUIVI_SELECT} ORDER BY s.created_at DESC, s.id DESC`,
  );
  res.json(rows);
});

app.post('/api/suivis', async (req, res) => {
  const raw = req.body?.signal_id;
  const signal_id = Number(raw);
  if (!Number.isInteger(signal_id) || signal_id < 1) {
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
    const row = inserted.rows[0];
    const { rows } = await db.query(`${SUIVI_SELECT} WHERE s.id = $1`, [
      row.id,
    ]);
    res.status(201).json(rows[0]);
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
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
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

// Sans adresse, Node écoute sur toutes les interfaces : joignable hors du conteneur
app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}`));
