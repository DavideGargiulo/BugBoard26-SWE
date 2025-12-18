/* =========================================================
  ENUM TYPES
========================================================= */

CREATE TYPE IF NOT EXISTS ruolo AS ENUM (
  'Amministratore',
  'Standard'
);

CREATE TYPE IF NOT EXISTS tipo_issue AS ENUM (
  'Question',
  'Bug',
  'Documentation',
  'Feature'
);

CREATE TYPE IF NOT EXISTS stato_issue AS ENUM (
  'TODO',
  'In-Progress',
  'Done'
);

CREATE TYPE IF NOT EXISTS priorita AS ENUM (
  'Alta',
  'Media',
  'Bassa'
);

/* =========================================================
  TABLES
========================================================= */

-- Progetto
CREATE TABLE IF NOT EXISTS "progetto" (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE
);

-- Utente
CREATE TABLE IF NOT EXISTS "utente" (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cognome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  ruolo ruolo NOT NULL,
  keycloak_id VARCHAR(255) UNIQUE,
  ultimo_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issue
CREATE TABLE IF NOT EXISTS "issue" (
  id SERIAL PRIMARY KEY,
  titolo VARCHAR(255) NOT NULL,
  descrizione TEXT NOT NULL,
  tipo tipo_issue NOT NULL,
  stato stato_issue NOT NULL DEFAULT 'TODO',
  priorita priorita,
  id_creatore INTEGER NOT NULL REFERENCES "utente"(id) ON DELETE CASCADE,
  id_progetto INTEGER NOT NULL REFERENCES "progetto"(id) ON DELETE CASCADE
);

-- Commento
CREATE TABLE IF NOT EXISTS "commento" (
  id SERIAL PRIMARY KEY,
  testo TEXT NOT NULL,
  id_utente INTEGER NOT NULL REFERENCES "utente"(id) ON DELETE CASCADE,
  id_issue INTEGER NOT NULL REFERENCES "issue"(id) ON DELETE CASCADE
);

-- Allegato
CREATE TABLE IF NOT EXISTS "allegato" (
  id SERIAL PRIMARY KEY,
  nome_file_originale VARCHAR(255) NOT NULL,
  nome_file_storage VARCHAR(255) NOT NULL UNIQUE,
  percorso_relativo VARCHAR(500) NOT NULL,
  tipo_mime VARCHAR(50) NOT NULL,
  dimensione_byte INTEGER NOT NULL CHECK (dimensione_byte <= 5242880),
  hash_sha256 VARCHAR(64),
  id_commento INTEGER REFERENCES "commento"(id) ON DELETE CASCADE,
  id_issue INTEGER REFERENCES "issue"(id) ON DELETE CASCADE,
  CONSTRAINT chk_allegato_xor CHECK (
    (id_commento IS NOT NULL AND id_issue IS NULL) OR
    (id_commento IS NULL AND id_issue IS NOT NULL)
  )
);

/* =========================================================
  INDEXES
========================================================= */

CREATE INDEX IF NOT EXISTS idx_issue_creatore ON "issue"(id_creatore);
CREATE INDEX IF NOT EXISTS idx_issue_progetto ON "issue"(id_progetto);
CREATE INDEX IF NOT EXISTS idx_commento_utente ON "commento"(id_utente);
CREATE INDEX IF NOT EXISTS idx_commento_issue ON "commento"(id_issue);
CREATE INDEX IF NOT EXISTS idx_allegato_commento ON "allegato"(id_commento) WHERE id_commento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_allegato_issue ON "allegato"(id_issue) WHERE id_issue IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_allegato_hash ON "allegato"(hash_sha256) WHERE hash_sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_utente_keycloak_id ON "utente"(keycloak_id);

/* =========================================================
  COMMENTS
========================================================= */

COMMENT ON COLUMN "utente".keycloak_id IS 'ID utente su Keycloak';
COMMENT ON COLUMN "utente".ultimo_sync IS 'Ultima sincronizzazione con Keycloak';

/* =========================================================
  FUNCTION & TRIGGER
========================================================= */

-- Aggiorna lo stato della issue a 'In-Progress' al primo commento
CREATE OR REPLACE FUNCTION "update_issue_status_on_comment"()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "issue"
  SET "stato" = 'In-Progress'
  WHERE "id" = NEW."id_issue"
    AND "stato" = 'TODO'
    AND NOT EXISTS (
      SELECT 1
      FROM "commento"
      WHERE "id_issue" = NEW."id_issue"
        AND "id" <> NEW."id"
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trigger_update_issue_status"
  ON "commento";

CREATE TRIGGER "trigger_update_issue_status"
AFTER INSERT ON "commento"
FOR EACH ROW
EXECUTE FUNCTION "update_issue_status_on_comment"();

-- Previene l'aggiunta di commenti a issue in stato 'Done'
CREATE OR REPLACE FUNCTION prevent_comment_on_done_issue()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  issue_stato public.enum_issue_stato;
BEGIN
  SELECT stato
  INTO issue_stato
  FROM public.issue
  WHERE id = NEW.id_issue;

  -- Issue non trovata (paranoia difensiva)
  IF issue_stato IS NULL THEN
    RAISE EXCEPTION
      'Issue non trovata (id: %)',
      NEW.id_issue
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  -- Issue DONE → BLOCCO
  IF issue_stato = 'Done' THEN
    RAISE EXCEPTION
      'Impossibile aggiungere commenti: la issue % è in stato DONE',
      NEW.id_issue
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_comment_on_done ON commento;

CREATE TRIGGER trigger_prevent_comment_on_done
BEFORE INSERT ON public.commento
FOR EACH ROW
EXECUTE FUNCTION public.prevent_comment_on_done_issue();
