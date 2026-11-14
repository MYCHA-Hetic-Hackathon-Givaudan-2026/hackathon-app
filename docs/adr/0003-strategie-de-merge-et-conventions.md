# 0003. Stratégie de merge et conventions de messages

- **Statut** : Accepté
- **Date** : 2026-11-05
- **Décideurs** : Tech Lead (Yann N'DA)

## Contexte

L'atelier demande : squash autorisé (une fonctionnalité = un commit sur `develop`), merge commit autorisé (`develop` → `main`), suppression automatique des branches fusionnées, et squash avec « Default to pull request title ». Aucune convention de message de commit n'est imposée formellement. Avec le squash, c'est le titre de la PR qui devient le message sur `develop`.

Nous voulons un historique lisible, traçable depuis le tableau GitHub Projects (`Closes #N`), sans freiner les profils Data/Product.

## Options

### Option 1 — Squash → develop, merge → main, Conventional Commits sur le titre de PR (retenue)

- `feature|fix|…` → `develop` : Squash and merge, titre de PR au format Conventional Commits (`feat(api): ajoute /questions (#12)`).
- `develop` → `main` et `hotfix` → `main` : Merge commit (nœud de démo / release légère).
- `main` → `develop` (rétro-report hotfix) : Merge commit.
- Rebase merge : désactivé (une seule façon de faire par cible).
- Enforcement des titres : action `amannn/action-semantic-pull-request` comme check CI (pas de commitlint en hook, trop strict pour Data/Product).

**Coût accepté** : les commits intermédiaires de la feature disparaissent du tronc ; la qualité du message repose sur le titre de PR.

### Option 2 — Merge commits partout + commitlint strict

Chaque commit intermédiaire apparaît sur `develop`. commitlint en hook `commit-msg` husky.

**Coût** : historique bruyant ; friction forte pour les contributeurs non-dev ; diverge de la consigne squash de l'atelier.

### Option 3 — Squash partout (y compris vers main)

Plus homogène, mais efface le nœud de fusion `develop` → `main` utile pour visualiser les démos/jalons.

## Décision

Nous retenons l'**option 1**, alignée sur l'atelier et améliorée par Conventional Commits au bon endroit (titre de PR).

## Conséquences

- Réglages dépôt : squash oui, merge commit oui, rebase non ; « Automatically delete head branches » oui ; « Default to pull request title » oui ; « Always suggest updating PR branches » oui.
- Modèle de PR enrichi : Quoi/Pourquoi, Comment tester, `Closes #N`, type de changement, ADR impacté ?, capture UI si besoin, aucun secret, taille < ~400 lignes, cases atelier (dev container, code IA relu).
- release-please / semantic-release : écartés pour deux semaines ; les tags `m0`/`m1`/`m2` font office de releases (à noter comme exclusion dans le barème « choix justifiés »).
