# 0006. Tenir le contrat HTTP dans openapi.yaml, en contract-first

- **Statut** : Acceptée
- **Date** : 2026-11-10 (confirmée 2026-11-12)
- **Décideurs** : Tech Lead (Yann N'DA)

## Contexte

Le jalon m1 demande un contrat d'API versionné dans le dépôt. Une page `/docs` servie par un processus qui tourne ne compte pas : elle disparaît quand le processus s'arrête, et elle n'est pas relue dans la pull request.

Le fichier proposé est [`openapi.yaml`](../../openapi.yaml), à la racine, en OpenAPI 3.1. Il décrit le monolithe `hackathon-app` : `GET /api/health`, la ressource d'exemple `/api/questions`, et le proxy `POST /api/tendances`. Le domaine métier Givaudan n'y est pas inventé.

L'API de l'équipe Data (FastAPI, `GET /health`, `POST /tendances`) reste un autre service. Son contrat est [`docs/data/openapi.json`](../data/openapi.json). `openapi.yaml` ne décrit que le proxy du monolithe.

## Options

### Option 1 — Contract-first : `openapi.yaml` est la source de vérité (retenue)

Toute route ajoutée ou modifiée dans `api/src/index.ts` est d'abord décrite dans `openapi.yaml`, dans la même pull request. Le code suit le fichier, pas l'inverse.

**Coût accepté** : deux endroits à tenir alignés à la main, tant qu'on ne génère pas le contrat.

### Option 2 — Code-first (générer le contrat depuis Express)

tsoa ou un équivalent produirait le YAML depuis les annotations. Moins de dérive, plus d'outillage, et le contrat n'existe pas tant que le code n'est pas écrit. Hors de ce que m1 demande pour cette semaine.

### Option 3 — S'en tenir à une page `/docs` vivante

Suffisant pour essayer un appel, insuffisant pour le jalon : rien à relire dans git, rien à citer depuis un ADR.

## Décision

Nous retenons l'**option 1**. Le fichier est diffable, cité par ce document et par `AGENTS.md`, et limité à ce que l'API expose.

Confirmée le **2026-11-12** : toute route monolithe (`/api/health`, `/api/questions`, `/api/signaux`, `/api/suivis`, proxy Data, …) passe par [`openapi.yaml`](../../openapi.yaml) avant ou avec le code. Le principe contract-first tient. Si le détail des routes proxy Data change (ex. retrait de `/tendances` au profit de `scan`/`predict`), on met à jour `openapi.yaml` dans la même PR ; un **nouvel ADR** ne sera nécessaire que si l'on abandonne le contract-first.

## Conséquences

- **Positives** : la pull request montre le changement de contrat ; un assistant de code a une source unique (`AGENTS.md` pointe ici).
- **Négatives, à accepter** : `openapi.yaml` peut prendre de l'avance ou du retard sur `api/src/index.ts` si la pull request n'est pas tenue.
- **À revoir si** : l'équipe adopte un générateur, ou si le contrat Data est copié dans ce dépôt.
