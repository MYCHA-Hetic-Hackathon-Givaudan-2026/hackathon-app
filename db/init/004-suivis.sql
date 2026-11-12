-- Suivis TrendRadar : référence un signal, sans copie de score.
-- Joué au premier démarrage de PostgreSQL uniquement.
-- Sur une base déjà créée : psql postgres://app:app@db:5432/app -f db/init/004-suivis.sql

CREATE TABLE suivis (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  signal_id INTEGER NOT NULL UNIQUE REFERENCES signaux (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX suivis_created_at_idx ON suivis (created_at DESC);
