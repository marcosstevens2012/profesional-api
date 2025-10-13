#!/bin/bash
# Script para ejecutar migraciones en Railway usando conexión directa

echo "🔄 Running database migrations..."

# Usar DATABASE_URL_DIRECT si está disponible, sino usar DATABASE_URL
MIGRATION_URL="${DATABASE_URL_DIRECT:-$DATABASE_URL}"

# Ejecutar migraciones con la URL adecuada
DATABASE_URL="$MIGRATION_URL" npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully"
  exit 0
else
  echo "⚠️ Migrations failed, but continuing with build..."
  echo "You may need to run migrations manually"
  exit 0  # No fallar el build si las migraciones fallan
fi
