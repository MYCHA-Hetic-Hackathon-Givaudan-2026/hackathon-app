# Tickets à créer pour le jalon m1

À coller dans GitHub (Issues → New issue) ou à créer d'un coup avec `./tickets.sh`.

Le barème `m1` demande **au moins 3 tickets** dans un tableau GitHub Projects, lié au dépôt `hackathon-app` et lisible par la team `evaluation`. Les tickets ci-dessous couvrent chaque livrable `m1`, plus les modèles de tickets du cours.

Titre au format Conventional Commits (ce sera aussi le titre de la PR, écrasé sur `develop` par le squash). Type GitHub recommandé : **Task**. Critères en cases, vérifiables par quelqu'un d'autre.

Labels proposés : `m1`, `documentation` (à créer si besoin : le script s'en charge).

---

## 1. `docs(adr): rédiger l'ADR 0001 sur la stack`

**Type** : Tâche · **Labels** : `m1`, `documentation` · **Size** : S

### Objectif

Consigner le choix de stack (langages, monolithe, amorces API/front, base, IA) dans `docs/adr/0001-stack.md`, comme le demande le jalon. Aujourd'hui le texte est une **proposition** : le Tech Lead doit la confirmer ou la remplacer.

### Critères d'acceptation

- [ ] Le fichier `docs/adr/0001-stack.md` est sur `develop`, au format du modèle `docs/adr/0000-modele.md` (contexte, options, décision, conséquences).
- [ ] Au moins deux options réellement comparées, avec un coût accepté et une condition de révision.
- [ ] Le statut est « proposée » tant que Yann n'a pas confirmé, puis « acceptée » dans un commit ou une PR de confirmation (on ne réécrit pas le reste en cachette).
- [ ] Aucune affirmation inventée sur le sujet métier Givaudan.

### Hors périmètre

Implémenter toute la stack dans cette PR (dev container, `api/`, `web/`) si ce n'est pas déjà fait : tickets dédiés.

---

## 2. `docs(adr): rédiger l'ADR 0006 du contrat OpenAPI`

**Type** : Tâche · **Labels** : `m1`, `documentation` · **Size** : S

### Objectif

Décider que le contrat HTTP vit dans le dépôt, en contract-first, et le justifier. Cet ADR **cite** `openapi.yaml` (lien relatif), critère explicite du jalon `m1`.

### Critères d'acceptation

- [ ] Le fichier `docs/adr/0006-contrat-api-openapi.md` est sur `develop`.
- [ ] Il contient un lien relatif vers `openapi.yaml` (depuis `docs/adr/` : `../../openapi.yaml`).
- [ ] Il compare au moins le contract-first et une alternative (code-first ou `/docs` seul).
- [ ] Statut « proposée » jusqu'à confirmation du Tech Lead.

### Hors périmètre

Génération automatique du contrat (tsoa, etc.).

---

## 3. `docs(api): publier le contrat OpenAPI (openapi.yaml)`

**Type** : Tâche · **Labels** : `m1`, `documentation` · **Size** : S

### Objectif

Déposer un vrai fichier OpenAPI 3.1 à la racine. La route `/docs` d'un service ne suffit pas.

### Critères d'acceptation

- [ ] `openapi.yaml` est à la racine du dépôt, sur `develop`.
- [ ] Le document est en OpenAPI 3.1, YAML valide (lint Redocly ou équivalent sans erreur).
- [ ] Il décrit au moins `GET /api/health` et une ressource d'exemple (`/api/questions`).
- [ ] Le domaine métier Givaudan n'est pas inventé : le contrat reste générique jusqu'à une PR ultérieure.

### Hors périmètre

Implémenter toutes les routes si l'API n'existe pas encore ; UI Swagger hébergée.

---

## 4. `docs: ajouter AGENTS.md pour les assistants de code`

**Type** : Tâche · **Labels** : `m1`, `documentation` · **Size** : S

### Objectif

Brief unique, à la racine, pour Copilot, Cursor et les autres assistants. Au moins 400 octets. `CLAUDE.md` n'est pas exigé.

### Critères d'acceptation

- [ ] `AGENTS.md` est à la racine, sur `develop`, et pèse au moins 400 octets.
- [ ] Il contient les quatre blocs : Lancer, Règles, Décisions, À ne pas faire.
- [ ] Chaque consigne cite un chemin, une commande ou un ADR de ce dépôt (pas de conseil générique).
- [ ] Il renvoie vers `docs/adr/` et vers `openapi.yaml`.
- [ ] Il rappelle : pas de secrets, pas de push direct, pas de `--no-verify`, code généré relu, travail dans le dev container.

### Hors périmètre

`CLAUDE.md` (uniquement si l'équipe utilise Claude Code : alors une ligne `@AGENTS.md`).

---

## 5. `chore: installer le tableau GitHub Projects et y lier les tickets`

**Type** : Tâche · **Labels** : `m1` · **Size** : S

### Objectif

Satisfaire le critère « au moins 3 tickets dans un tableau GitHub Projects, lié au dépôt et lisible par la team `evaluation` ». Le tableau n'est pas dans le tag : il doit exister à la relève.

### Critères d'acceptation

- [ ] Un Project d'organisation nommé `Hackathon` existe sous `MYCHA-Hetic-Hackathon-Givaudan-2026`.
- [ ] Il est lié au dépôt `hackathon-app` (onglet Projects du dépôt → Link a project, ou `gh project link`).
- [ ] Les colonnes Status sont : Backlog, Ready, In progress, In review, Done.
- [ ] Au moins 3 tickets du dépôt apparaissent comme cartes (idéalement ceux de ce fichier).
- [ ] La team `evaluation` a le rôle **Read** sur le tableau (Settings → Manage access). Le rôle de base reste « No access ».
- [ ] Les équipes `tech-leads` (Admin), `data` et `product` (Write) y ont aussi accès, comme le cours le demande.

### Hors périmètre

Automatisations fines (on peut les activer ensuite, voir le cours « Le tableau »).

---

## 6. `chore: ajouter les modèles de tickets Story, Tâche, Spike et Bug`

**Type** : Tâche · **Labels** : `m1`, `documentation` · **Size** : S

### Objectif

Empêcher les tickets vierges et imposer les champs du cours (besoin, critères, hors périmètre, seuil pour un spike…).

### Critères d'acceptation

- [ ] Les fichiers `.github/ISSUE_TEMPLATE/1-story.yml`, `2-tache.yml`, `3-spike.yml`, `4-bug.yml` et `config.yml` (`blank_issues_enabled: false`) sont sur `develop` (GitHub ne lit les modèles que sur la branche par défaut).
- [ ] Issues → New issue propose Story, Tâche, Spike et Bug, sans « ticket vierge ».
- [ ] Le type d'issue `Spike` existe dans l'organisation (Settings → Planning → Issue types), s'il n'était pas déjà là.

### Hors périmètre

Rédiger le backlog produit complet.

---

## 7. `docs(adr): rédiger l'ADR 0007 sur PostgreSQL 17`

**Type** : Tâche · **Labels** : `m1`, `documentation` · **Size** : S

### Objectif

Le second ADR « composant » exigé par `m1` peut être la base (le cours donne PostgreSQL en exemple). L'ADR 0006 (contrat OpenAPI) joue déjà ce rôle ; celui-ci documente le moteur de données.

### Critères d'acceptation

- [ ] `docs/adr/0007-postgresql.md` est sur `develop`.
- [ ] Il compare au moins PostgreSQL, SQLite et une autre option (MariaDB, etc.).
- [ ] Statut « proposée » jusqu'à confirmation du Tech Lead.

### Hors périmètre

Mettre en place `compose.yaml` / `db/init/` si ce n'est pas déjà fait : ticket d'implémentation séparé.
