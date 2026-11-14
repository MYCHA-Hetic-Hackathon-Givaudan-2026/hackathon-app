# 0005. Garder le dépôt public

- **Statut** : Accepté
- **Date** : 2026-11-10
- **Décideurs** : Tech Lead (Yann N'DA)

## Contexte

Le dépôt `MYCHA-Hetic-Hackathon-Givaudan-2026/hackathon-app` est public. L'évaluation lit le code et les pull requests sans invitation sur le dépôt. Le tableau GitHub Projects, lui, a ses propres droits : un dépôt public ne rend pas le Project lisible. Ce point est traité dans `docs/github-project-visibilite.md`, pas ici.

Aucun secret ne vit dans le dépôt. La configuration locale reste dans `api/.env`, ignoré par git.

## Options

### Option 1 — Dépôt public (retenue)

Le code, les ADR et le contrat `openapi.yaml` sont lisibles par l'équipe, l'évaluation et les autres groupes.

**Coût accepté** : tout ce qui est commité est public. Un secret commité par erreur doit être révoqué, pas seulement effacé du dernier commit.

### Option 2 — Dépôt privé, évaluation invitée

Le code n'est plus lisible sans droit. L'invitation peut manquer le jour de la relève, et un ruleset d'organisation sur un dépôt privé dépend du plan GitHub.

## Décision

Nous retenons l'**option 1**.

## Conséquences

- `README.md`, `docs/adr/` et `openapi.yaml` sont la vitrine du dépôt : pas de brouillon de session dedans (`.scratch/` reste ignoré).
- La team `evaluation` doit quand même être invitée en Read sur le Project `Hackathon`. Le dépôt public ne suffit pas pour le critère du tableau.
- À revoir si un partenaire exige un dépôt privé avant la fin du hackathon : nouvel ADR, puis déplacement des secrets déjà absents du git.
