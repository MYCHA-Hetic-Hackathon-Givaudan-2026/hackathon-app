#!/usr/bin/env bash
# Crée les tickets m1, un Project d'organisation « Hackathon », le lie au
# dépôt hackathon-app, et y ajoute les tickets.
#
# Prérequis :
#   gh auth login
#   gh auth refresh -s project
# Le scope « project » est obligatoire pour gh project create / link / item-add.
# Sans lui, gh répond 403. Relancer : gh auth refresh -s project
#
# Ensuite, dans l'UI (voir docs/github-project-visibilite.md) :
#   - inviter la team evaluation en Read (critère du barème m1)
#   - inviter tech-leads (Admin), data et product (Write)
#   - régler les colonnes Status et le champ Size
#
# Usage, depuis n'importe quel dossier :
#   bash tickets.sh
# Optionnel : PROJECT_TITLE="Hackathon" bash tickets.sh

set -euo pipefail

ORG="MYCHA-Hetic-Hackathon-Givaudan-2026"
REPO="${ORG}/hackathon-app"
PROJECT_TITLE="${PROJECT_TITLE:-Hackathon}"

if ! command -v gh >/dev/null; then
  echo "gh n'est pas installé (CLI GitHub)." >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "gh n'est pas authentifié. Lance : gh auth login && gh auth refresh -s project" >&2
  exit 1
fi

echo "==> Vérification de l'accès au dépôt ${REPO}"
gh repo view "${REPO}" --json name --jq .name >/dev/null

echo "==> Création des labels m1 et documentation (ok s'ils existent déjà)"
gh label create m1 --repo "${REPO}" --description "Jalon m1" --color 0E8A16 --force
gh label create documentation --repo "${REPO}" --description "Documentation, ADR, contrat" --color 0075CA --force

create_issue() {
  local title="$1"
  local body="$2"
  gh issue create --repo "${REPO}" --title "${title}" --label "m1,documentation" --body "${body}"
}

echo "==> Création des tickets"

url1=$(create_issue "docs(adr): rédiger l'ADR 0001 sur la stack" "$(cat <<'EOF'
## Objectif

Consigner le choix de stack (langages, monolithe, amorces API/front, base, IA) dans `docs/adr/0001-stack.md`, comme le demande le jalon m1. Aujourd'hui le texte est une **proposition** : le Tech Lead doit la confirmer ou la remplacer.

## Critères d'acceptation

- [ ] Le fichier `docs/adr/0001-stack.md` est sur `develop`, au format du modèle `docs/adr/0000-modele.md` (contexte, options, décision, conséquences).
- [ ] Au moins deux options réellement comparées, avec un coût accepté et une condition de révision.
- [ ] Le statut est « proposée » tant que Yann n'a pas confirmé, puis « acceptée » dans un commit ou une PR de confirmation (on ne réécrit pas le reste en cachette).
- [ ] Aucune affirmation inventée sur le sujet métier Givaudan.

## Hors périmètre

Implémenter toute la stack dans cette PR si ce n'est pas déjà fait : tickets dédiés.
EOF
)")
echo "    ${url1}"

url2=$(create_issue "docs(adr): rédiger l'ADR 0006 du contrat OpenAPI" "$(cat <<'EOF'
## Objectif

Décider que le contrat HTTP vit dans le dépôt, en contract-first, et le justifier. Cet ADR **cite** `openapi.yaml` (lien relatif), critère explicite du jalon m1.

## Critères d'acceptation

- [ ] Le fichier `docs/adr/0006-contrat-api-openapi.md` est sur `develop`.
- [ ] Il contient un lien relatif vers `openapi.yaml` (depuis `docs/adr/` : `../../openapi.yaml`).
- [ ] Il compare au moins le contract-first et une alternative (code-first ou `/docs` seul).
- [ ] Statut « proposée » jusqu'à confirmation du Tech Lead.

## Hors périmètre

Génération automatique du contrat (tsoa, etc.).
EOF
)")
echo "    ${url2}"

url3=$(create_issue "docs(api): publier le contrat OpenAPI (openapi.yaml)" "$(cat <<'EOF'
## Objectif

Déposer un vrai fichier OpenAPI 3.1 à la racine. La route `/docs` d'un service ne suffit pas.

## Critères d'acceptation

- [ ] `openapi.yaml` est à la racine du dépôt, sur `develop`.
- [ ] Le document est en OpenAPI 3.1, YAML valide (lint Redocly ou équivalent sans erreur).
- [ ] Il décrit au moins `GET /api/health` et une ressource d'exemple (`/api/questions`).
- [ ] Le domaine métier Givaudan n'est pas inventé : le contrat reste générique jusqu'à une PR ultérieure.

## Hors périmètre

Implémenter toutes les routes si l'API n'existe pas encore ; UI Swagger hébergée.
EOF
)")
echo "    ${url3}"

url4=$(create_issue "docs: ajouter AGENTS.md pour les assistants de code" "$(cat <<'EOF'
## Objectif

Brief unique, à la racine, pour Copilot, Cursor et les autres assistants. Au moins 400 octets. `CLAUDE.md` n'est pas exigé.

## Critères d'acceptation

- [ ] `AGENTS.md` est à la racine, sur `develop`, et pèse au moins 400 octets.
- [ ] Il contient les quatre blocs : Lancer, Règles, Décisions, À ne pas faire.
- [ ] Chaque consigne cite un chemin, une commande ou un ADR de ce dépôt (pas de conseil générique).
- [ ] Il renvoie vers `docs/adr/` et vers `openapi.yaml`.
- [ ] Il rappelle : pas de secrets, pas de push direct, pas de `--no-verify`, code généré relu, travail dans le dev container.

## Hors périmètre

`CLAUDE.md` (uniquement si l'équipe utilise Claude Code : alors une ligne `@AGENTS.md`).
EOF
)")
echo "    ${url4}"

url5=$(create_issue "chore: installer le tableau GitHub Projects et y lier les tickets" "$(cat <<'EOF'
## Objectif

Satisfaire le critère « au moins 3 tickets dans un tableau GitHub Projects, lié au dépôt et lisible par la team evaluation ». Le tableau n'est pas dans le tag : il doit exister à la relève.

## Critères d'acceptation

- [ ] Un Project d'organisation nommé `Hackathon` existe sous `MYCHA-Hetic-Hackathon-Givaudan-2026`.
- [ ] Il est lié au dépôt `hackathon-app` (onglet Projects du dépôt → Link a project).
- [ ] Les colonnes Status sont : Backlog, Ready, In progress, In review, Done.
- [ ] Au moins 3 tickets du dépôt apparaissent comme cartes.
- [ ] La team `evaluation` a le rôle Read sur le tableau (Settings → Manage access). Le rôle de base reste « No access ».
- [ ] Les équipes `tech-leads` (Admin), `data` et `product` (Write) y ont aussi accès.

## Hors périmètre

Automatisations fines (on peut les activer ensuite).
EOF
)")
echo "    ${url5}"

url6=$(create_issue "chore: ajouter les modèles de tickets Story, Tâche, Spike et Bug" "$(cat <<'EOF'
## Objectif

Empêcher les tickets vierges et imposer les champs du cours (besoin, critères, hors périmètre, seuil pour un spike…).

## Critères d'acceptation

- [ ] Les fichiers `.github/ISSUE_TEMPLATE/1-story.yml`, `2-tache.yml`, `3-spike.yml`, `4-bug.yml` et `config.yml` (`blank_issues_enabled: false`) sont sur `develop`.
- [ ] Issues → New issue propose Story, Tâche, Spike et Bug, sans « ticket vierge ».
- [ ] Le type d'issue `Spike` existe dans l'organisation (Settings → Planning → Issue types), s'il n'était pas déjà là.

## Hors périmètre

Rédiger le backlog produit complet.
EOF
)")
echo "    ${url6}"

url7=$(create_issue "docs(adr): rédiger l'ADR 0007 sur PostgreSQL 17" "$(cat <<'EOF'
## Objectif

Documenter le choix du moteur de données. L'ADR 0006 (contrat OpenAPI) joue déjà le rôle d'ADR « composant » exigé par m1 ; celui-ci porte sur PostgreSQL 17.

## Critères d'acceptation

- [ ] `docs/adr/0007-postgresql.md` est sur `develop`.
- [ ] Il compare au moins PostgreSQL, SQLite et une autre option (MariaDB, etc.).
- [ ] Statut « proposée » jusqu'à confirmation du Tech Lead.

## Hors périmètre

Mettre en place `compose.yaml` / `db/init/` si ce n'est pas déjà fait : ticket d'implémentation séparé.
EOF
)")
echo "    ${url7}"

echo "==> Création du Project d'organisation « ${PROJECT_TITLE} »"
project_json=$(gh project create --owner "${ORG}" --title "${PROJECT_TITLE}" --format json)
project_number=$(printf '%s' "${project_json}" | jq -r '.number')
project_url=$(printf '%s' "${project_json}" | jq -r '.url')

if [[ -z "${project_number}" || "${project_number}" == "null" ]]; then
  echo "Impossible de lire le numéro du Project. Sortie brute :" >&2
  echo "${project_json}" >&2
  exit 1
fi

echo "    Project #${project_number} — ${project_url}"

echo "==> Lien du Project au dépôt ${REPO}"
gh project link "${project_number}" --owner "${ORG}" --repo "${REPO}"

# Filet de sécurité : un Project public est lisible sans invitation.
# Ça ne remplace PAS l'invitation de la team evaluation en Read (voir
# docs/github-project-visibilite.md). Si cette commande échoue (droits org),
# ce n'est pas bloquant : continue et fais le geste UI.
echo "==> Visibilité Public (optionnel, filet de sécurité)"
if gh project edit "${project_number}" --owner "${ORG}" --visibility PUBLIC; then
  echo "    Visibilité PUBLIC"
else
  echo "    Impossible de passer en PUBLIC depuis la CLI : à faire dans l'UI, ou laisse privé et invite evaluation en Read." >&2
fi

echo "==> Ajout des tickets au Project"
for url in "${url1}" "${url2}" "${url3}" "${url4}" "${url5}" "${url6}" "${url7}"; do
  gh project item-add "${project_number}" --owner "${ORG}" --url "${url}"
  echo "    + ${url}"
done

cat <<EOF

Terminé.
  Project : ${project_url}
  Dépôt   : https://github.com/${REPO}

Il reste à faire dans l'UI (5 minutes, voir docs/github-project-visibilite.md) :
  1. Project → ⋯ → Settings → Manage access → inviter evaluation (Read),
     tech-leads (Admin), data et product (Write). Base role : No access.
  2. Régler les colonnes Status : Backlog, Ready, In progress, In review, Done.
  3. Ajouter le champ Size (S / M / L).
  4. Vérifier l'onglet Projects du dépôt.

Sans l'invitation de evaluation, le critère m1 est manqué.
EOF
