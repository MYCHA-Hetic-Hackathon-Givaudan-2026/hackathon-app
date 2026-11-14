# 0002. Modèle de branches (GitFlow allégé)

- **Statut** : Accepté
- **Date** : 2026-11-05
- **Décideurs** : Tech Lead (Yann N'DA)

## Contexte

Le hackathon dure deux semaines. L'atelier Glassworks exige les branches `main`, `develop`, `feature/*` et `hotfix/*`, sans `release/*`. Les jalons d'évaluation `m0`, `m1` et `m2` se posent sur `develop`. Le barème note la protection de `main`/`develop` et les choix justifiés du Tech Lead.

Le GitFlow historique (Vincent Driessen, 2010) a été conçu pour des logiciels versionnés avec plusieurs lignes de maintenance. En 2020, Driessen a ajouté une note : pour une application livrée en continu, un flux plus simple (type GitHub Flow) est souvent préférable. Les défauts connus du GitFlow complet sont l'intégration tardive, les conflits sur branches longues, et la double branche permanente à synchroniser.

## Options

### Option 1 — GitFlow allégé + discipline trunk-based (retenue)

Conserver `main` + `develop` + `feature|fix|spike|chore|docs/*` + `hotfix/*`. Pas de `release/*`. Traiter `develop` comme un tronc :

- une branche = un ticket, durée ≤ 2 jours (Size L) ;
- synchronisation quotidienne de la feature sur `develop` ;
- PR `develop` → `main` avant chaque démo ou pose de jalon ;
- `main` = snapshot démontrable.

**Coût accepté** : synchroniser deux branches permanentes et gérer le rétro-report des hotfixes (`main` → `develop`).

### Option 2 — GitHub Flow pur (`main` seule)

Chaque feature part de `main` et y revient par PR. Plus simple, plus proche des pratiques CI/CD modernes.

**Coût** : hors consigne atelier ; la démo « protection main/develop » disparaît ; les tags `m*` ne peuvent plus cibler `develop` comme prévu. Perte de points barème trop élevée pour le gain.

## Décision

Nous retenons l'**option 1**. Elle satisfait le barème et les jalons tout en limitant les risques d'intégration tardive grâce à des features courtes et une synchro quotidienne.

## Conséquences

- `develop` est la branche par défaut du dépôt.
- Les préfixes autorisés : `feature/`, `fix/`, `spike/`, `chore/`, `docs/`, `hotfix/`.
- Convention de nommage : `<type>/<n°issue>-<slug>` (ex. `feature/12-login-form`).
- Après un hotfix fusionné sur `main`, une PR de rétro-report `main` → `develop` (ou cherry-pick) est obligatoire.
- Les tags `m0`, `m1`, `m2` se posent sur `develop`.
