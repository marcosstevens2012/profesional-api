#!/bin/bash

# 🚀 SCRIPT DE DEPLOY COMPLETO PARA RAILWAY
# Ejecuta: ./railway-deploy-now.sh

set -e

echo ""
echo "🚀 =========================================="
echo "   DEPLOY PROFESIONAL-API EN RAILWAY"
echo "==========================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📦 Paso 1: Preparando archivos...${NC}"
git add .
git commit -m "Fix Railway nixpacks configuration" || echo "No hay cambios nuevos"
echo -e "${GREEN}✅ Archivos preparados${NC}"
echo ""

echo -e "${BLUE}🔗 Paso 2: Creando proyecto en Railway...${NC}"
echo ""
echo "⚠️  ATENCIÓN: Cuando pregunte el nombre del proyecto:"
echo "   Escribe: profesional-api"
echo "   Luego selecciona: Create new project"
echo ""
read -p "Presiona Enter para continuar..."

railway init

echo ""
echo -e "${GREEN}✅ Proyecto creado${NC}"
echo ""

echo -e "${BLUE}🌐 Paso 3: Abriendo dashboard para configurar variables...${NC}"
echo ""
echo "Se abrirá el navegador. Ve a la pestaña 'Variables' y copia estas:"
echo ""
echo -e "${YELLOW}VARIABLES MÍNIMAS REQUERIDAS:${NC}"
echo ""
echo "DATABASE_URL=postgresql://postgres:V4XFgKs2umHFNY4i@db.anqdbinmztorvdsausrn.supabase.co:5432/postgres"
echo "JWT_SECRET=cambia-esto-por-algo-super-seguro-de-32-caracteres-minimo"
echo "NODE_ENV=production"
echo "CORS_ORIGINS=https://tudominio.com"
echo "SUPABASE_URL=https://anqdbinmztorvdsausrn.supabase.co"
echo "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucWRiaW5tenRvcnZkc2F1c3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDcyMjksImV4cCI6MjA3MzE4MzIyOX0.7LJecpCm2yyfVU8PyRYx-vBnCQkav4qoY00Z6-kVacM"
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucWRiaW5tenRvcnZkc2F1c3JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzYwNzIyOSwiZXhwIjoyMDczMTgzMjI5fQ.kvOFL7YrLp6H-MiK6HX2Pi2Mjm6UND2pVi0tP1LuR7U"
echo "STORAGE_PROVIDER=supabase"
echo "SUPABASE_STORAGE_BUCKET=attachments"
echo "ENABLE_SWAGGER=false"
echo "FRONTEND_BASE_URL=https://tudominio.com"
echo ""
echo -e "${RED}⚠️  IMPORTANTE: Cambia JWT_SECRET, CORS_ORIGINS y FRONTEND_BASE_URL${NC}"
echo ""
read -p "Presiona Enter cuando hayas copiado las variables..."

railway open

echo ""
read -p "¿Ya configuraste las variables? (s/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ Por favor configura las variables primero${NC}"
    echo "Ejecuta: railway open"
    echo "Luego vuelve a ejecutar este script"
    exit 1
fi

echo ""
echo -e "${BLUE}🚀 Paso 4: Desplegando en Railway...${NC}"
echo ""

railway up

echo ""
echo -e "${GREEN}✅ Desplegado exitosamente${NC}"
echo ""

echo -e "${BLUE}🗄️  Paso 5: Ejecutando migraciones de base de datos...${NC}"
railway run npx prisma migrate deploy

echo ""
echo -e "${GREEN}✅ Migraciones ejecutadas${NC}"
echo ""

echo -e "${BLUE}🌍 Paso 6: Generando dominio público...${NC}"
DOMAIN=$(railway domain)

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}✅ ¡DEPLOY COMPLETADO EXITOSAMENTE!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "${BLUE}🔗 Tu API está en:${NC}"
echo -e "${YELLOW}${DOMAIN}${NC}"
echo ""
echo -e "${BLUE}📊 Ver logs:${NC} railway logs"
echo -e "${BLUE}📈 Ver métricas:${NC} railway open"
echo -e "${BLUE}✅ Probar API:${NC} curl ${DOMAIN}/health"
echo ""
echo -e "${GREEN}==========================================${NC}"
echo ""
