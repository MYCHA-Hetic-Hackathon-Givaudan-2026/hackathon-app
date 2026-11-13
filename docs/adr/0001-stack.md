# 0001. Adopter Node 24, TypeScript, Express, Vite et PostgreSQL 17 comme stack de départ

- **Statut** : Acceptée
- **Date** : 2026-11-10 (confirmée 2026-11-12)
- **Décideurs** : Tech Lead (Yann N'DA)

## Contexte

Le hackathon dure deux semaines. L'équipe mêle des profils Tech, Data/IA et Product, sur macOS, Windows et Linux. L'objectif de lundi : cloner le dépôt, ouvrir VS Code, et lancer tout le projet en 15 minutes.

Le cours Glassworks laisse le choix des langages et des frameworks, mais tous les exemples, le dev container, la CI `qualite` déjà préparée (`node:24-trixie`, `npm ci`, `lint`, `format:check`, `build`) et le monolithe `api/` + `web/` reposent sur Node.js 24 et TypeScript. La stack doit aussi rester proche de la production : Debian, Node 24, PostgreSQL 17, configuration par variables d'environnement.

Le sujet métier Givaudan n'est pas encore spécifié ici : cette décision porte uniquement sur l'environnement et les amorces techniques, pas sur le domaine.

## Options

### Option 1 — Stack du cours, en monolithe npm workspaces (retenue)

- Poste de travail : dev container `mcr.microsoft.com/devcontainers/typescript-node:24-trixie`, lancé par `compose.yaml` (service `dev`).
- Monolithe : espaces de travail npm `api/` et `web/`, un seul `package-lock.json`, commandes `npm run dev`, `npm run lint`, `npm run format:check`, `npm run build`.
- API de départ : Express + TypeScript, port 3000, routes sous `/api`.
- Front de départ : Vite + TypeScript, port 5173, proxy `/api` → `http://localhost:3000`.
- Base : PostgreSQL 17 (détail dans l'ADR 0007).
- IA : tout fournisseur compatible OpenAI, choisi par `api/.env` (Ollama sur la machine en dev, option commerciale ou API Data/IA plus tard). Un ADR dédié suivra quand le fournisseur de démo sera tranché.

Le cours dit explicitement qu'Express et Vite servent à tester l'environnement, pas forcément au produit final : on peut remplacer le contenu de `api/` ou `web/` (Nest, Fastify, React, Vue…) sans changer le dev container, les ports ni les scripts.

**Coût accepté** : Express/Vite sont des amorces, pas une promesse de framework « définitif ». Un changement de framework fera l'objet d'un nouvel ADR.

### Option 2 — Stack Python (FastAPI) pour tout le backend

Un seul langage avec l'équipe Data/IA. Éloigne le dépôt de l'image Node 24, de la CI `qualite` (ESLint, Prettier, `npm ci`) et des ateliers déjà suivis. Coût d'alignement trop élevé pour deux semaines.

### Option 3 — Next.js (ou un méta-framework) dès le premier jour

Un seul outil pour le front et l'API. Casse le contrat du cours (workspaces `api/` + `web/`, ports 3000 et 5173, proxy Vite) et mélange deux responsabilités avant d'avoir une tranche verticale. Reportable plus tard, par un nouvel ADR, si le produit le justifie.

## Décision

Nous retenons l'**option 1**. Elle est celle de l'environnement, de la CI et des consignes d'atelier, tout en laissant les frameworks remplaçables.

Confirmée le **2026-11-12** : la stack en place est Node 24 + TypeScript, Express (`api/`), Vite + React (`web/`), PostgreSQL 17, monolithe npm workspaces, IA via `ask()` / `api/.env`. React a été adopté **dans** Vite, sans changer ports ni scripts — conforme à cette ADR.

## Conséquences

- **Positives** : même poste de travail pour toute l'équipe ; la CI déjà écrite reste valable ; un nouvel arrivant suit le `README.md` et le dev container.
- **Négatives, à accepter** : deux amorces (Express, Vite) à remplacer si l'équipe choisit d'autres frameworks ; un monolithe Node, alors que Data/IA code plutôt en Python (leur service peut vivre dans `ia/` ou un dépôt lié).
- **À revoir si** : l'équipe tranche un autre runtime, ou si un méta-framework s'avère indispensable avant la première démo.
