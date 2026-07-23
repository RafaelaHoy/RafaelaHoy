-- Crear tabla para cachear resultados de feeds RSS por fuente
CREATE TABLE IF NOT EXISTS rss_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rss_cache_source_id ON rss_cache(source_id);
CREATE INDEX IF NOT EXISTS idx_rss_cache_fetched_at ON rss_cache(fetched_at);
