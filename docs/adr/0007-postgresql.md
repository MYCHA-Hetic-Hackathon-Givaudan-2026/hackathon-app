# 0007. Utiliser PostgreSQL 17 comme moteur de données

- **Statut** : Acceptée
- **Date** : 2026-11-10 (confirmée 2026-11-12)
- **Décideurs** : Tech Lead (Yann N'DA)

## Contexte

L'amorce actuelle stocke les questions dans PostgreSQL. `compose.yaml` lance `postgres:17`. Le schéma et les seeds sont dans `db/init/`, joués au premier démarrage du volume `db/data/` (ignoré par git). L'API s'y connecte avec `pg`, via `DATABASE_URL`.

Cette décision ne décrit pas le modèle métier Givaudan. Elle choisit le moteur. La stack globale est dans l'ADR 0001.

## Options

### Option 1 — PostgreSQL 17 dans Compose (retenue)

Même moteur en dev et pour la démo. Types déjà utilisés dans `db/init/001-schema.sql` (`TIMESTAMPTZ`, identité). Plusieurs processus (API, un futur script) peuvent s'y connecter.

**Coût accepté** : un service de plus à attendre au démarrage du dev container (`depends_on` + healthcheck).

### Option 2 — SQLite, fichier dans le dépôt ou le volume

Aucun serveur. Suffisant pour une seule API et un seul rédacteur. Éloigne le projet du SQL déjà écrit et d'un usage à plusieurs connexions. Le fichier de base finit souvent commité par erreur.

### Option 3 — MariaDB (ou MySQL)

Autre serveur, autre dialecte. Il faudrait réécrire `db/init/` et changer le client dans `api/src/index.ts`, sans gain pour le hackathon.

## Décision

Nous retenons l'**option 1**, déjà celle de `compose.yaml` et du SQL présent.

Confirmée le **2026-11-12** : PostgreSQL 17 est le moteur en place (`postgres:17` dans Compose, `pg` + `DATABASE_URL`, seeds `db/init/` pour questions, signaux et suivis). Aucun basculement vers SQLite ou MariaDB.

## Conséquences

- **Positives** : le schéma se relit dans git ; recréer la base, c'est supprimer `db/data/` puis relancer Compose.
- **Négatives, à accepter** : modifier un SQL ne migre pas une base déjà initialisée.
- **À revoir si** : l'équipe abandonne le serveur de données, ou si l'hébergement de démo n'offre pas PostgreSQL.
