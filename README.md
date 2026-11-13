# hackathon-app

Monolithe du hackathon HETIC × Givaudan 2026, dépôt [`MYCHA-Hetic-Hackathon-Givaudan-2026/hackathon-app`](https://github.com/MYCHA-Hetic-Hackathon-Givaudan-2026/hackathon-app).
Il donne à toute l'organisation le même poste de travail : API, front, PostgreSQL et un modèle local.
---

Les décisions de stack, de branches et de revue sont dans [`docs/adr/`](docs/adr/). Le contrat de l'API Data est [`docs/data/openapi.json`](docs/data/openapi.json).

## Équipes

Organisation GitHub : `MYCHA-Hetic-Hackathon-Givaudan-2026`. Tech Lead : Yann N'DA. Le tableau Project `Hackathon` a ses propres droits (détail dans [`docs/github-project-visibilite.md`](docs/github-project-visibilite.md)).

| Équipe       | Accès au Project | Rôle                                                                |
| ------------ | ---------------- | ------------------------------------------------------------------- |
| `tech-leads` | Admin            | API, front, dev container, CI, revue des chemins sensibles          |
| `data`       | Write            | API radar (trend-radar FastAPI), contrat dans `docs/data/`          |
| `product`    | Write            | Tickets, priorités, recette                                         |
| `evaluation` | Read             | Lecture du tableau pour les jalons (`m0`, `m1`, `m2` sur `develop`) |

## Prise en main

Prérequis : Docker, VS Code et l'extension Dev Containers.

1. Cloner le dépôt et l'ouvrir dans VS Code.
2. **Reopen in Container.** Compose démarre le poste `dev`, PostgreSQL 17 et Ollama, puis télécharge le modèle. La première fois, `npm ci` installe les dépendances et copie `api/.env.example` vers `api/.env`.
3. Dans le conteneur :

```bash
npm run dev
```

4. Ouvrir [http://localhost:5173](http://localhost:5173). L'API écoute sur le port 3000. Le front proxifie `/api` vers elle.

Vérifier la base et l'API :

```bash
curl -s localhost:3000/api/health
```

La réponse contient `"status":"ok"`. Sans `DATA_AI_URL` dans `api/.env`, les questions et `/api/signaux` fonctionnent ; les proxies Data (`/api/scan/latest`, `/api/predict`, …) répondent 503. Les secrets restent dans `api/.env`, jamais dans git.

Contrôles, les mêmes que la CI :

```bash
npm run lint && npm run format:check && npm run build
```

## Travailler sur le dépôt

Une branche par ticket, depuis `develop` : `<type>/<n°issue>-<slug>` (`feature`, `fix`, `spike`, `chore`, `docs`, `hotfix`). La pull request vise `develop`, titre en Conventional Commits, corps selon [`docs/PULL_REQUEST_TEMPLATE.md`](docs/PULL_REQUEST_TEMPLATE.md), avec `Closes #N`. Fusion vers `develop` : squash. Fusion `develop` → `main` : merge commit. Pas de push direct sur `main` ni `develop`.

| Dossier     | Contenu                                                               |
| ----------- | --------------------------------------------------------------------- |
| `api/`      | API Express, port 3000                                                |
| `web/`      | Front Vite, port 5173                                                 |
| `db/init/`  | Schéma et données de test, au premier démarrage de Postgres seulement |
| `docs/adr/` | Décisions d'architecture                                              |
