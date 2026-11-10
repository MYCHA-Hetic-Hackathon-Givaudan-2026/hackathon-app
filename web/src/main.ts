type Question = { id: number; question: string; answer: string };

const health = document.querySelector('#health')!;
const form = document.querySelector('form')!;
const list = document.querySelector('#questions')!;

async function refresh() {
  const status = await fetch('/api/health').then((r) => r.json());
  health.textContent = `API OK · ${status.db}`;

  const questions: Question[] = await fetch('/api/questions').then((r) =>
    r.json(),
  );
  list.replaceChildren(
    ...questions.map((q) => {
      const item = document.createElement('li');
      item.textContent = `${q.question} → ${q.answer}`;
      return item;
    }),
  );
}

form.addEventListener('submit', async (event) => {
type Tendance = { terme: string; croissance_pct: number; statut: string };

const tendancesForm = document.querySelector<HTMLFormElement>('#tendances')!;
const tendancesStatus = document.querySelector('#tendances-status')!;
const tendancesList = document.querySelector('#tendances-list')!;

tendancesForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const raw = String(new FormData(tendancesForm).get('termes') ?? '');
  const termes = raw
    .split(',')
    .map((terme) => terme.trim())
    .filter(Boolean);
  tendancesStatus.textContent = 'Appel de l'API Data…';
  tendancesList.replaceChildren();
  const response = await fetch('/api/tendances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ termes }),
  });
  const body = await response.json();
  if (!response.ok) {
    tendancesStatus.textContent = body.error ?? 'Échec de l'appel Data';
    return;
  }
  const tendances = body as Tendance[];
  tendancesStatus.textContent = `${tendances.length} résultat(s)`;
  tendancesList.replaceChildren(
    ...tendances.map((tendance) => {
      const item = document.createElement('li');
      item.textContent = `${tendance.terme} · ${tendance.croissance_pct} % · ${tendance.statut}`;
      return item;
    }),
  );
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = new FormData(form).get('question');
  await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  form.reset();
  await refresh();
});

refresh();
