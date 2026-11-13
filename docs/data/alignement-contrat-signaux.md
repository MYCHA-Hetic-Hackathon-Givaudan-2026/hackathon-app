# Alignement contrat Data ↔ signaux TrendRadar

- Statut : **conforme routes Data** (proxy monolithe) + écarts de schéma documentés
- Date : 2026-11-12
- Sources : [malickl/trend-radar](https://github.com/malickl/trend-radar) (`docs/API.md`), [`openapi.json`](./openapi.json), [`openapi.yaml`](../../openapi.yaml)

## Contexte

L’API Data réelle (trend-radar) **n’expose pas** `POST /tendances`. L’ancien contrat monolithe `0.1-dummy` (`terme` / `croissance_pct` / `statut`) est **obsolète** et a été remplacé.

| Rôle                     | Contrat / route                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Data (amont)             | [`openapi.json`](./openapi.json) — `/health`, `/scan/latest`, `/predict`, …                 |
| Proxy monolithe          | `GET /api/data/health`, `GET /api/scan/latest`, `POST /api/predict`, `GET /api/scan/status` |
| Globe (schéma monolithe) | `GET /api/signaux` → schéma `Signal` (graine SQL démo)                                      |

**Règle** : pas de faux scores. On ne mappe pas `growth_since_t0` → `croissance_pct` ni `label` → `statut_data`. Les champs fictifs Data (`demo_fictif`) ne sont pas réécrits en « vrais » champs monolithe sans accord.

## Routes : conformité

| Data (trend-radar)       | Proxy monolithe        | État                     |
| ------------------------ | ---------------------- | ------------------------ |
| `GET /health`            | `GET /api/data/health` | Conforme                 |
| `GET /scan/latest`       | `GET /api/scan/latest` | Conforme                 |
| `POST /predict`          | `POST /api/predict`    | Conforme                 |
| `GET /scan/status`       | `GET /api/scan/status` | Conforme                 |
| `POST /predict_features` | _(non proxifié)_       | Hors besoin UI actuelle  |
| `POST /scan/run`         | _(non proxifié)_       | Ops Data                 |
| `POST /tendances`        | **supprimé**           | N’existait pas côté Data |

`DATA_AI_URL` pointe vers la base trend-radar (ex. `http://127.0.0.1:8000`). Le proxy ajoute `ngrok-skip-browser-warning` pour les tunnels.

## Écart schémas : `Signal` ↔ `ScanRow`

Le globe garde `Signal` (noms produit monolithe). Data sert `ScanRow` via `/scan/latest`.

| `Signal` (monolithe)       | `ScanRow` (Data)                   | Mapping ?                          | Réel / fictif démo |
| -------------------------- | ---------------------------------- | ---------------------------------- | ------------------ |
| `nom`                      | `title`                            | Oui (rename)                       | Réel               |
| `famille`                  | `group`                            | Oui                                | Réel               |
| `domaine`                  | `domaine`                          | Oui                                | **Fictif** démo    |
| `profil` `durable`\|`buzz` | `label` `Tendance durable`\|`Buzz` | Oui (enum)                         | Réel               |
| `confiance_pct` 50–100     | `proba_tendance` 0–1               | Oui (×100) ; buzz peut être &lt;50 | Réel               |
| `croissance_pct`           | — (`growth_since_t0` ≠ %)          | **Non** — rester `null`            | N/A                |
| `statut_data`              | — (pas émergent/stable/en baisse)  | **Non** — rester `null`            | N/A                |
| `cc`                       | `country`                          | Oui                                | **Fictif** démo    |
| `pays`                     | —                                  | **Absent** Data                    | —                  |
| `lat` / `lon`              | `lat` / `lon`                      | Oui                                | **Fictif** démo    |
| `ce_qui_plait`             | `element_cle`                      | Oui                                | **Fictif** démo    |
| `veille_resume`            | `veille.resume`                    | Oui                                | **Fictif** démo    |
| `matieres[]`               | `matieres_premieres`               | Oui                                | **Fictif** démo    |
| `decollage`                | `t0`                               | Oui                                | Réel               |
| `predit_en`                | `date_prediction`                  | Oui                                | **Fictif** démo    |
| `verifiable_en`            | `verdict_verifiable_le`            | Oui                                | Réel               |
| `sources[]` `{label,url}`  | `veille.sources[]` `{titre,url}`   | Oui (rename)                       | Liens réels        |

En `DEMO_MODE=0`, Data **n’envoie plus** domaine / geo / veille / matières / `date_prediction`. Le monolithe conserve alors la **graine** pour le globe.

## Décisions

1. **Proxies** alignés sur trend-radar ; ancien `POST /api/tendances` retiré du contrat et du code.
2. **`GET /api/signaux`** reste la graine démo (IDs stables pour suivis). Consommer Data brut via `/api/scan/latest`.
3. **Pas d’adaptateur Signal ← ScanRow** dans cette PR (évite d’ingérer des champs `demo_fictif` comme vérité). Suite possible : ticket dédié avec règles de mapping + filtre `exclu_raison === null`.
4. On **ne réécrit pas** l’ADR 0006 (proposée) : seul l’exemple `/tendances` dans son texte est daté ; le principe contract-first tient. Mise à jour ADR = PR séparée si le Tech Lead le demande.

## Vérification

```bash
# Contrat Data
jq '.paths | keys' docs/data/openapi.json
# → ["/health","/predict","/predict_features","/scan/latest","/scan/run","/scan/status"]

# Proxy (Data doit tourner, DATA_AI_URL configurée)
curl -s localhost:3000/api/data/health
curl -s localhost:3000/api/scan/latest | jq '{n, demo_fictif, title: .rows[0].title}'
```
