# Backlog — features futures

Fichier libre pour noter ce qui n’est **pas** dans l’app actuelle.  
Cocher / ajouter / réordonner à volonté. Pour un travail engagé, ouvrir une GitHub Issue et lier le numéro ici.

Légende : `[ ]` à faire · `[~]` en cours / PR ouverte · `[x]` fait sur `develop`

---

## Produit / UX

- [ ] Brancher le **brief métier** sur l’IA (`ask()`) ou un endpoint Data (aujourd’hui générateur client démo — PR #31)
- [ ] Remplacer les dates / sections « démo » du panneau rapport par les champs Data réels quand `DEMO_MODE=0`
- [ ] Parcours **région d’abord** (filtre geo explicite) en plus du globe
- [ ] Export brief PDF / Markdown
- [ ] Onboarding court (3 étapes) pour un manager CMI qui découvre FORECASTRO
- [ ] Accessibilité : focus trap modales, contrastes thème sombre, labels aria globe
- [ ] i18n FR / EN

## Data / API

- [~] Aligner proxies monolithe sur trend-radar (`/scan/latest`, `/predict`, …) — **PR #29**
- [ ] Adaptateur **`ScanRow` → `Signal`** (mapping documenté, pas de faux scores)
- [ ] Filtrer `exclu_raison !== null` avant affichage globe
- [ ] Endpoint monolithe « signaux enrichis » (seed ∪ scan) avec politique de merge claire
- [ ] Proxifier `POST /scan/run` / `POST /predict_features` si l’UI ops le demande
- [ ] Health agrégé : monolithe + Data + IA dans `GET /api/health`

## Suivis & veille

- [~] Veille append-only + agent conversationnel — **PR #26**
- [ ] Suivis **par utilisateur** (auth) au lieu d’une liste globale
- [ ] Notifications (digest mail / in-app) quand un suivi change de profil ou de confiance
- [ ] Historique de confiance dans le temps (sparkline dans le rapport)

## Technique / qualité

- [x] Confirmer ADR **0001 / 0006 / 0007** (statut acceptée) — 2026-11-13
- [ ] Mettre à jour `openapi.yaml` si retrait définitif de `POST /api/tendances` sur `develop` (nouvel ADR seulement si abandon du contract-first)
- [ ] Tests API (health, signaux, suivis) + smoke Playwright landing → explorer → rapport
- [ ] Storybook ou page `/lab` pour tokens / composants shell
- [ ] Budget perf canvas (FPS zoom ×8, machines faibles)
- [ ] CI : lint OpenAPI (Redocly) sur `openapi.yaml` + `docs/data/openapi.json`
- [ ] Documentation déploiement (sans secrets) hors du seul dev container

## Hors produit (ne pas glisser dans le monolithe sans ADR)

- [ ] CRM / catalogue SKU Givaudan
- [ ] Outil de formulation pour créateurs
- [ ] App mobile native
- [ ] Scraping / social listening (appartient à Data)

---

## Idées libres

_Ajoute ici ce qui émerge en démo ou en atelier :_

-
-
-
