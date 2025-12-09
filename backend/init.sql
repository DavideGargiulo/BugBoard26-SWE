-- Creazione dei tipi ENUM
CREATE TYPE ruolo AS ENUM (
	'Amministratore',
	'Standard'
);

CREATE TYPE tipo_issue AS ENUM (
	'Question',
	'Bug',
	'Documentation',
	'Feature'
);

CREATE TYPE stato_issue AS ENUM (
	'TODO',
	'In-Progress',
	'Done'
);

CREATE TYPE priorita AS ENUM (
	'Alta',
	'Media',
	'Bassa'
);

-- Creazione tabella Progetto (prima per le dipendenze)
CREATE TABLE IF NOT EXISTS "progetto" (
	id SERIAL PRIMARY KEY,
	nome VARCHAR(255) NOT NULL UNIQUE
);

-- Creazione tabella Utente
CREATE TABLE IF NOT EXISTS "utente" (
	id SERIAL PRIMARY KEY,
	nome VARCHAR(255) NOT NULL,
	cognome VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	ruolo ruolo NOT NULL
);

-- Creazione tabella Issue
CREATE TABLE IF NOT EXISTS "issue" (
	id SERIAL PRIMARY KEY,
	titolo VARCHAR(255) NOT NULL,
	descrizione TEXT NOT NULL,
	tipo tipo_issue NOT NULL,
	stato stato_issue NOT NULL,
	priorita priorita,
	id_creatore INTEGER NOT NULL REFERENCES "utente"(id) ON DELETE CASCADE,
	id_progetto INTEGER NOT NULL REFERENCES "progetto"(id) ON DELETE CASCADE
);

-- Creazione tabella Commento
CREATE TABLE IF NOT EXISTS "commento" (
	id SERIAL PRIMARY KEY,
	testo TEXT NOT NULL,
	id_utente INTEGER NOT NULL REFERENCES "utente"(id) ON DELETE CASCADE,
	id_issue INTEGER NOT NULL REFERENCES "issue"(id) ON DELETE CASCADE
);

-- Creazione tabella Allegato
CREATE TABLE IF NOT EXISTS "allegato" (
	id SERIAL PRIMARY KEY,
	nome_file_originale VARCHAR(255) NOT NULL,
	nome_file_storage VARCHAR(255) NOT NULL UNIQUE,  -- Nome univoco sul filesystem
	percorso_relativo VARCHAR(500) NOT NULL,  -- Percorso dalla root dello storage
	tipo_mime VARCHAR(50) NOT NULL,  -- es: 'image/jpeg', 'image/png'
	dimensione_byte INTEGER NOT NULL CHECK (dimensione_byte <= 5242880),
	hash_sha256 VARCHAR(64),  -- Per verifica integrità
	id_commento INTEGER REFERENCES "commento"(id) ON DELETE CASCADE,
	id_issue INTEGER REFERENCES "issue"(id) ON DELETE CASCADE,
	CONSTRAINT chk_allegato_xor CHECK (
		(id_commento IS NOT NULL AND id_issue IS NULL) OR
		(id_commento IS NULL AND id_issue IS NOT NULL)
	)
);

-- Indici per migliorare le performance
CREATE INDEX idx_issue_creatore ON "issue"(id_creatore);
CREATE INDEX idx_issue_progetto ON "issue"(id_progetto);
CREATE INDEX idx_commento_utente ON "commento"(id_utente);
CREATE INDEX idx_commento_issue ON "commento"(id_issue);
CREATE INDEX idx_allegato_commento ON "allegato"(id_commento) WHERE id_commento IS NOT NULL;
CREATE INDEX idx_allegato_issue ON "allegato"(id_issue) WHERE id_issue IS NOT NULL;
CREATE INDEX idx_allegato_hash ON "allegato"(hash_sha256) WHERE hash_sha256 IS NOT NULL;

-- Migrazione: Aggiunta campi per sincronizzazione Keycloak

-- 1. Aggiungi colonna keycloak_id alla tabella utente
ALTER TABLE "utente"
ADD COLUMN IF NOT EXISTS keycloak_id VARCHAR(255) UNIQUE;

-- 2. Aggiungi colonna per timestamp ultima sincronizzazione
ALTER TABLE "utente"
ADD COLUMN IF NOT EXISTS ultimo_sync TIMESTAMP;

-- 3. Aggiungi colonne timestamps (createdAt, updatedAt)
ALTER TABLE "utente"
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 4. Rendi il campo password nullable (ora gestito da Keycloak)
ALTER TABLE "utente"
ALTER COLUMN password DROP NOT NULL;

-- 5. Crea indice sulla colonna keycloak_id per performance
CREATE INDEX IF NOT EXISTS idx_utente_keycloak_id ON "utente"(keycloak_id);

-- 6. Aggiungi commento alle colonne
COMMENT ON COLUMN "utente".keycloak_id IS 'ID utente su Keycloak per sincronizzazione';
COMMENT ON COLUMN "utente".password IS 'Deprecato - autenticazione gestita da Keycloak';
COMMENT ON COLUMN "utente".ultimo_sync IS 'Timestamp ultima sincronizzazione con Keycloak';

-- 7. Visualizza lo stato della tabella
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'utente'
ORDER BY ordinal_position;