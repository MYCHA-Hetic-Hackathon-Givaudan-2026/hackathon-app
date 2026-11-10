# AGENTS.md

Monolithe `hackathon-app` (HETIC Hackathon Givaudan 2026). API Express, front Vite, PostgreSQL 17 et un fournisseur d'IA compatible OpenAI, dans un dev container VS Code. Présentation humaine : `README.md`. Contrat HTTP : `openapi.yaml`. Décisions : `docs/adr/`.

## Lancer

Toutes les commandes se lancent dans le dev container (service `dev` de `compose.yaml`), pas sur la machine hôte.

- `npm run dev` : API sur le port 3000, front sur le port 5173 (espaces de travail `api/` et `web/`).
- `curl -s localhost:3000/api/health` doit répondre un JSON avec `"status":"ok"`.
- Avant de dire « fini » : `npm run lint`, `npm run format:check`, `npm run build`. Ce sont les contrôles du job CI `qualite` (`.github/workflows/ci.yml`), dans l'image `node:24-trixie`.
- Base : `psql postgres://app:app@db:5432/app`. Le schéma et les graines sont dans `db/init/`.

## Règles

- Les routes HTTP de l'API sont dans `api/src/index.ts`. Le front appelle `/api` : le proxy est dans `web/vite.config.ts`.
- Le contrat à respecter est `openapi.yaml` (OpenAPI 3.1), pas une route `/docs` générée à la volée. Tout ajout ou changement de route passe d'abord par ce fichier, dans la même pull request (ADR 0006).
- Le schéma et les données de test sont dans `db/init/`, joués au premier démarrage seulement : modifier un SQL ne change pas une base déjà créée (`db/data/` est local, ignoré par git).
- Tout fournisseur compatible OpenAI passe par `ask()`, dans `api/src/index.ts`. Pour en changer, on modifie `api/.env` (copié depuis `api/.env.example`), pas le code. Les secrets ne sont jamais commités.
- Une branche par ticket, depuis `develop`, nommée `<type>/<n°issue>-<slug>` (ex. `feature/12-liste-questions`). Types : `feature`, `fix`, `spike`, `chore`, `docs`, `hotfix`. La pull request vise `develop`, titre en Conventional Commits, description selon `docs/PULL_REQUEST_TEMPLATE.md`, `Closes #N`, moins de ~400 lignes.
- Fusion vers `develop` : Squash and merge. Fusion `develop` → `main` : merge commit. Pas de rebase merge, pas de push direct sur `main` ni `develop`.
- Le plan d'un travail vit dans son ticket : `gh issue view N`. Les brouillons de session vont dans `.scratch/`, ignoré par git, en Markdown, pas en TypeScript (ESLint lirait un `.ts`).

## Décisions

- Lis `docs/adr/` avant d'ajouter une dépendance ou de changer de composant. Le modèle est `docs/adr/0000-modele.md`.
- Ne contredis pas un ADR au statut « acceptée ». Les ADR 0002 à 0005 (GitFlow, merge, protections, dépôt public) sont acceptés. Les ADR 0001 (stack), 0006 (`openapi.yaml`) et 0007 (PostgreSQL 17) sont encore au statut « proposée » : à confirmer par le Tech Lead, pas à réécrire en silence.
- S'il faut changer une décision acceptée ou proposée, propose un nouvel ADR, puis arrête-toi. On ne réécrit pas un ADR : on le remplace.
- Raccourcis : Node 24 + TypeScript, pas un autre runtime (ADR 0001) ; PostgreSQL, pas SQLite (ADR 0007) ; contrat dans `openapi.yaml` (ADR 0006).

## À ne pas faire

- Pousser directement sur `develop` ou `main`, ou contourner un ruleset / un hook (`git commit --no-verify`, `eslint-disable` pour faire passer un contrôle).
- Lancer `npm install` hors du conteneur : `package-lock.json` doit rester valable sous Linux (image Debian trixie, Node 24).
- Écrire une clé, un jeton ou un mot de passe dans le code, un ticket ou un commit. Les secrets vont dans `api/.env` ou les GitHub Actions secrets, jamais dans le dépôt.
- Inventer une route ou un champ qui n'est pas dans `openapi.yaml`.
- Copier du code d'assistant sans le relire : tout code généré est relu par un humain avant la pull request.
