#!/bin/sh
set -e

until nc -z postgres 5432; do
  echo "Waiting for PostgreSQL at postgres:5432..."
  sleep 2
done

echo "PostgreSQL is up. Running Prisma migrations..."

npx prisma migrate deploy
npm run start:dev
