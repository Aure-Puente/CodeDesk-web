#!/bin/sh
# Crea la base de tests (<POSTGRES_DB>_test) junto a la de desarrollo.
# Solo corre la primera vez que se crea el volumen de datos.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "CREATE DATABASE \"${POSTGRES_DB}_test\";"
