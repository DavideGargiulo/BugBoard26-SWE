#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE keycloakdb'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloakdb')\gexec
    GRANT ALL PRIVILEGES ON DATABASE keycloakdb TO $POSTGRES_USER;
EOSQL

echo "Database keycloakdb created successfully!"