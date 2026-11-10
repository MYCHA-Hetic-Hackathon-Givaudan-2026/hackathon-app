# 0004. Protéger main et develop par un ruleset, sans liste de contournement

- **Statut** : Accepté
- **Date** : 2026-11-10
- **Décideurs** : Tech Lead (Yann N'DA)

## Contexte

L'atelier demande que `main` et `develop` refusent le push direct. Le ruleset `protect-main-develop` existe, en enforcement **Active**. Tant que les motifs de branches étaient écrits `"main"` et `"develop"` (guillemets compris), GitHub ne ciblait aucune branche : un push direct sur `develop` passait. Les motifs utiles sont `main` et `develop`, sans guillemets. La ligne du ruleset doit indiquer qu'il s'applique à 2 cibles.

La liste de contournement est vide. Un administrateur passe donc par une pull request, comme le reste de l'équipe.

## Options

### Option 1 — Ruleset actif sur `main` et `develop`, sans bypass (retenue)

Ruleset `protect-main-develop`, enforcement Active, cibles `main` et `develop` :

- suppression de ces branches interdite ;
- pull request obligatoire avant fusion, 1 approbation, approbations périmées écartées dès qu'un nouveau commit arrive ;
- revue exigée de l'équipe `tech-leads` sur les chemins sensibles (`.devcontainer/`, `.github/`, `compose.yaml`, `eslint.config.js`, `package.json`) ;
- une approbation de plus si Copilot ouvre la pull request sans collaborateur humain ;
- force-push interdit.

La case « Require review from Code Owners » reste décochée : la revue de ces chemins est portée par la règle d'équipe du ruleset. Le fichier `.github/CODEOWNERS` (branche `feature/codeowners`) reprend les mêmes chemins, avec `eslint.config.js` et non `eslint.config.mjs`.

**Coût accepté** : personne, y compris un admin, ne pousse directement. Une correction urgente passe par `hotfix/*` puis une pull request.

### Option 2 — Laisser les administrateurs dans la liste de contournement

Plus souple pour débloquer une démo. Le barème et l'habitude d'équipe s'en trouvent contournés le jour où on est pressé.

### Option 3 — Protéger seulement `main`

`develop` resterait ouvert au push direct. Les jalons `m*` se posent sur `develop` : un push non relu atterritrait dans le commit évalué.

## Décision

Nous retenons l'**option 1**.

## Conséquences

- Un `git push` direct sur `main` ou `develop` doit être refusé (`GH013: Repository rule violations`).
- La pull request vers `develop` demande une approbation, renouvelée si la branche bouge.
- Les checks de CI ne sont pas exigés par ce ruleset : le job `qualite` (`.github/workflows/ci.yml`) informe, il ne bloque pas tant que la règle « Require status checks » n'est pas ajoutée.
- À revoir si l'équipe ajoute des admins de circonstance : les remettre dans la liste de contournement serait un nouvel ADR, pas une case cochée en silence.
