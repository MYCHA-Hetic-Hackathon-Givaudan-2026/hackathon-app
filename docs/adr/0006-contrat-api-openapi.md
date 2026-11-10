# 0006. Tenir le contrat HTTP dans openapi.yaml, en contract-first

- **Statut** : Proposée (à confirmer par le Tech Lead avant de passer à « acceptée »)
- **Date** : 2026-11-10
- **Décideurs** : Tech Lead (Yann N'DA) — proposition, pas encore tranchée

## Contexte

Le jalon m1 demande un contrat d'API versionné dans le dépôt. Une page `/docs` servie par un processus qui tourne ne compte pas : elle disparaît quand le processus s'arrête, et elle n'est pas relue dans la pull request.

Le fichier proposé est [`openapi.yaml`](../../openapi.yaml), à la racine, en OpenAPI 3.1. Il décrit le monolithe `hackathon-app` : `GET /api/health` et la ressource d'exemple `/api/questions`. Le domaine métier Givaudan n'y est pas inventé.

L'API de l'équipe Data (FastAPI, `GET /health`, `POST /tendances`) est un autre service. Son contrat n'est pas celui de ce fichier. L'y intégrer sera une pull request séparée, quand le Tech Lead aura validé ce lot.

## Options

### Option 1 — Contract-first : `openapi.yaml` est la source de vérité (proposée)

Toute route ajoutée ou modifiée dans `api/src/index.ts` est d'abord décrite dans `openapi.yaml`, dans la même pull request. Le code suit le fichier, pas l'inverse.

**Coût accepté** : deux endroits à tenir alignés à la main, tant qu'on ne génère pas le contrat.

### Option 2 — Code-first (générer le contrat depuis Express)

tsoa ou un équivalent produirait le YAML depuis les annotations. Moins de dérive, plus d'outillage, et le contrat n'existe pas tant que le code n'est pas écrit. Hors de ce que m1 demande pour cette semaine.

### Option 3 — S'en tenir à une page `/docs` vivante

Suffisant pour essayer un appel, insuffisant pour le jalon : rien à relire dans git, rien à citer depuis un ADR.

## Décision

Nous **proposons l'option 1**, parce que le fichier est déjà diffable, cité par ce document, et limité à ce que l'API fait vraiment.

**Cette décision n'est pas encore acceptée.** Le Tech Lead doit la confirmer, ou la remplacer par un nouvel ADR, avant de passer le statut à « acceptée ».

## Conséquences

- **Positives** : la pull request montre le changement de contrat ; un assistant de code a une source unique (`AGENTS.md` pointe ici).
- **Négatives, à accepter** : `openapi.yaml` peut prendre de l'avance ou du retard sur `api/src/index.ts` si la pull request n'est pas tenue.
- **À revoir si** : l'équipe adopte un générateur, ou si le contrat Data est copié dans ce dépôt.
