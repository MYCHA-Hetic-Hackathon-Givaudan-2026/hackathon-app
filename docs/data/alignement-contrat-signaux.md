# Alignement contrat Data ↔ signaux TrendRadar

- Statut : **décision de spike** (issue [#27](https://github.com/MYCHA-Hetic-Hackathon-Givaudan-2026/hackathon-app/issues/27))
- Date : 2026-11-12
- Public : équipes `data` et monolithe (`api` / `web`)

## Contexte

Le globe TrendRadar consomme `GET /api/signaux` (schéma `Signal` dans [`openapi.yaml`](../../openapi.yaml)). La graine démo (`db/init/003-signaux.sql`) fournit les 45 signaux du mockup.

L’API Data expose `POST /tendances` ([`openapi.json`](./openapi.json), version `0.1-dummy`). Le monolithe la proxifie via `POST /api/tendances` (`DATA_AI_URL`).

**Règle** : tant qu’un champ n’est pas dans le contrat Data **et** recopié dans `openapi.yaml`, le monolithe sert la graine démo. On ne fabrique pas de faux scores Data.

## Contrat Data actuel (`Tendance`)

| Champ            | Type   | Notes                                 |
| ---------------- | ------ | ------------------------------------- |
| `terme`          | string | Identifiant textuel (ex. Yuzu)        |
| `croissance_pct` | number | Croissance                            |
| `statut`         | string | `émergent` \| `stable` \| `en baisse` |

C’est tout. Pas de profil T/B, pas de confiance, pas de géo, pas de matières ni de calendrier.

## Écart champ par champ (Signal monolithe)

| Champ monolithe (`Signal`)                  | Présent Data ?     | Source autorisée aujourd’hui                        | Inventer ? |
| ------------------------------------------- | ------------------ | --------------------------------------------------- | ---------- |
| `nom`                                       | via `terme`\*      | Seed ; matching texte éventuel avec `terme`         | Non        |
| `croissance_pct`                            | **oui**            | `null` en seed ; enrichissable si match `terme`     | Non        |
| `statut_data`                               | **oui** (`statut`) | `null` en seed ; enrichissable si match `terme`     | Non        |
| `profil` (`durable`\|`buzz`)                | **non**            | Seed démo uniquement                                | **Non**    |
| `confiance_pct`                             | **non**            | Seed démo uniquement                                | **Non**    |
| `lat` / `lon`                               | **non**            | Seed démo uniquement                                | **Non**    |
| `pays` / `cc`                               | **non**            | Seed démo uniquement                                | **Non**    |
| `famille` / `domaine`                       | **non**            | Seed démo uniquement                                | **Non**    |
| `ce_qui_plait`                              | **non**            | Seed démo uniquement                                | **Non**    |
| `veille_resume`                             | **non**            | Seed démo uniquement                                | **Non**    |
| `matieres[]`                                | **non**            | Seed démo uniquement                                | **Non**    |
| `decollage` / `predit_en` / `verifiable_en` | **non**            | Seed démo uniquement                                | **Non**    |
| `sources[]` (détail)                        | **non**            | Dérivées côté monolithe (Wikipedia / Trends / News) | N/A        |

\*Le matching `nom` ↔ `terme` est une convention d’intégration, pas un nouveau champ Data.

## Décision (tranche actuelle)

1. **Profil, confiance, géo et métadonnées TrendRadar** restent sur la **graine démo**. Aucun mapping local du type « `statut === émergent` ⇒ `profil = buzz` » (hors périmètre explicite du plan).
2. **Seuls** `croissance_pct` et `statut` du contrat Data peuvent enrichir `Signal.croissance_pct` et `Signal.statut_data`, et seulement :
   - si `DATA_AI_URL` est configurée,
   - si un `terme` Data correspond au `nom` du signal (égalité insensible à la casse, trim),
   - sans inventer de valeur quand Data ne répond pas ou ne match pas (`null` conservé).
3. On **ne modifie pas** [`openapi.json`](./openapi.json) unilatéralement. Toute extension passe par l’équipe Data, puis recopie contract-first dans `openapi.yaml` (ADR 0006).

## Proposition d’extension pour l’équipe Data

À discuter / implémenter **côté Data** (pas un engagement monolithe). Objectif : remplacer progressivement la graine pour les champs critiques globe.

Champs demandés (mockup TrendRadar / brief CMI) :

| Champ proposé Data                          | Type / contraintes       | Usage globe                     |
| ------------------------------------------- | ------------------------ | ------------------------------- |
| `profil`                                    | enum `durable` \| `buzz` | Marker T vs B, filtres chips    |
| `confiance_pct`                             | integer 50–100           | Taille marker, slider confiance |
| `lat` / `lon`                               | number (WGS84)           | Position sur le globe           |
| `pays` / `cc`                               | string / ISO alpha-2     | Rapport, callout                |
| `famille` / `domaine`                       | string                   | Rapport                         |
| `ce_qui_plait`                              | string                   | Rapport                         |
| `veille_resume`                             | string                   | Rapport                         |
| `matieres`                                  | string[]                 | Rapport                         |
| `decollage` / `predit_en` / `verifiable_en` | string `YYYYMM`          | Filtres 7/30/90 j, rapport      |

Options d’API (à trancher par Data) :

1. **Étendre** le schéma `Tendance` de `POST /tendances` avec les champs ci-dessus (nullable tant que non calculés).
2. **Nouveau** endpoint dédié (ex. `GET /signaux` ou `POST /signaux`) si le modèle « termes → tendance » ne couvre pas le catalogue globe.

Dans les deux cas : publier le Swagger Data à jour, puis le monolithe met à jour `docs/data/openapi.json` **depuis leur contrat**, et seulement ensuite `openapi.yaml` + code.

## Ticket de suite (hors spike)

Feature optionnelle (T8 plan) : [#28](https://github.com/MYCHA-Hetic-Hackathon-Givaudan-2026/hackathon-app/issues/28) — brancher l’enrichissement `croissance_pct` / `statut_data` sur `GET /api/signaux` (et affichage rapport) via `POST /api/tendances`, sans toucher profil / geo / confiance.

Critère : **aucun champ inventé hors OpenAPI**.

## Vérification rapide

```bash
# Contrat Data tel quel
jq '.components.schemas.Tendance' docs/data/openapi.json

# Champs Signal monolithe (extrait)
# openapi.yaml → components.schemas.Signal
```

Si Data n’a pas encore étendu le contrat : la démo jury s’appuie sur la graine ; `curl`/`GET /api/signaux` peut renvoyer `croissance_pct: null` et `statut_data: null`.
