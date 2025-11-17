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
CREATE TABLE IF NOT EXISTS "Progetto" (
	id SERIAL PRIMARY KEY,
	nome VARCHAR(255) NOT NULL UNIQUE
);

-- Creazione tabella Utente
CREATE TABLE IF NOT EXISTS "Utente" (
	id SERIAL PRIMARY KEY,
	nome VARCHAR(255) NOT NULL,
	cognome VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	ruolo ruolo NOT NULL
);

-- Creazione tabella Issue
CREATE TABLE IF NOT EXISTS "Issue" (
	id SERIAL PRIMARY KEY,
	titolo VARCHAR(255) NOT NULL,
	descrizione TEXT NOT NULL,
	tipo tipo_issue NOT NULL,
	stato stato_issue NOT NULL,
	priorita priorita,
	id_creatore INTEGER NOT NULL REFERENCES "Utente"(id) ON DELETE CASCADE,
	id_progetto INTEGER NOT NULL REFERENCES "Progetto"(id) ON DELETE CASCADE
);

-- Creazione tabella Commento
CREATE TABLE IF NOT EXISTS "Commento" (
	id SERIAL PRIMARY KEY,
	testo TEXT NOT NULL,
	id_utente INTEGER NOT NULL REFERENCES "Utente"(id) ON DELETE CASCADE,
	id_issue INTEGER NOT NULL REFERENCES "Issue"(id) ON DELETE CASCADE
);

-- Creazione tabella Allegato
CREATE TABLE IF NOT EXISTS "Allegato" (
	id SERIAL PRIMARY KEY,
	nome_file VARCHAR(255) NOT NULL,
	contenuto BYTEA NOT NULL,
	dimensione_byte INTEGER NOT NULL CHECK (dimensione_byte <= 5242880),
	id_commento INTEGER REFERENCES "Commento"(id) ON DELETE CASCADE,
	id_issue INTEGER REFERENCES "Issue"(id) ON DELETE CASCADE,
	CONSTRAINT chk_allegato_xor CHECK (
		(id_commento IS NOT NULL AND id_issue IS NULL) OR
		(id_commento IS NULL AND id_issue IS NOT NULL)
	)
);

-- Indici per migliorare le performance
CREATE INDEX idx_issue_creatore ON "Issue"(id_creatore);
CREATE INDEX idx_issue_progetto ON "Issue"(id_progetto);
CREATE INDEX idx_commento_utente ON "Commento"(id_utente);
CREATE INDEX idx_commento_issue ON "Commento"(id_issue);
CREATE INDEX idx_allegato_commento ON "Allegato"(id_commento);
CREATE INDEX idx_allegato_issue ON "Allegato"(id_issue);