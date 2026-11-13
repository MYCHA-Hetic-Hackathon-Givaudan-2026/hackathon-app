-- Veilles TrendRadar : notes IA append-only liées à un suivi.
-- Joué au premier démarrage de PostgreSQL uniquement.
-- Sur une base déjà créée : psql postgres://app:app@db:5432/app -f db/init/005-veilles.sql

CREATE TABLE veilles (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  suivi_id INTEGER NOT NULL REFERENCES suivis (id) ON DELETE CASCADE,
  texte TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX veilles_suivi_id_created_at_idx ON veilles (suivi_id, created_at DESC);
