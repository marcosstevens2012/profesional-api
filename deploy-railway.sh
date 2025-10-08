#!/bin/bash

# 🚀 Script de Deploy Automático para Railway
# Este script configura y despliega tu API en Railway paso a paso

set -e

echo "🚀 DESPLIEGUE EN RAILWAY - PROFESIONAL API"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mensajes
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Paso 1: Verificar que Railway CLI está instalado
info "Verificando Railway CLI..."
if ! command -v railway &> /dev/null; then
    warning "Railway CLI no está instalado. Instalando..."
    npm install -g @railway/cli
    success "Railway CLI instalado"
else
    success "Railway CLI ya está instalado"
fi

# Paso 2: Login (si no está logueado)
info "Verificando autenticación..."
if ! railway whoami &> /dev/null; then
    warning "No estás autenticado. Abriendo navegador para login..."
    railway login
fi
success "Autenticado correctamente"

# Paso 3: Mostrar instrucciones para crear proyecto
echo ""
echo "=========================================="
echo "📝 AHORA SIGUE ESTOS PASOS:"
echo "=========================================="
echo ""
echo "1. Ejecuta: railway init"
echo "   - Cuando pregunte el nombre: profesional-api"
echo "   - Selecciona: Create new project"
echo ""
echo "2. (OPCIONAL) Agregar PostgreSQL de Railway:"
echo "   railway add"
echo "   - Selecciona: PostgreSQL"
echo "   - O usa tu Supabase actual"
echo ""
echo "3. Configurar variables de entorno:"
echo "   railway open"
echo "   - Ve a la pestaña Variables"
echo "   - Copia las variables de .env.railway"
echo "   - ACTUALIZA: JWT_SECRET, CORS_ORIGINS, MERCADOPAGO (producción)"
echo ""
echo "4. Desplegar:"
echo "   railway up"
echo ""
echo "5. Ejecutar migraciones:"
echo "   railway run npx prisma migrate deploy"
echo ""
echo "6. Generar URL pública:"
echo "   railway domain"
echo ""
echo "7. Verificar:"
echo "   railway logs"
echo ""
echo "=========================================="
echo "📋 VARIABLES CRÍTICAS A CONFIGURAR:"
echo "=========================================="
echo ""
echo "✅ DATABASE_URL (si usas Supabase o Railway PostgreSQL)"
echo "✅ JWT_SECRET (genera uno seguro de 32+ caracteres)"
echo "✅ CORS_ORIGINS (tu dominio de producción)"
echo "✅ MERCADOPAGO_ACCESS_TOKEN (token de PRODUCCIÓN)"
echo "✅ MERCADOPAGO_PUBLIC_KEY (clave de PRODUCCIÓN)"
echo "✅ MERCADOPAGO_SANDBOX=false"
echo "✅ NODE_ENV=production"
echo "✅ FRONTEND_BASE_URL (URL de tu frontend)"
echo ""
echo "Todas las variables están en: .env.railway"
echo ""
echo "=========================================="
echo "🎯 COMANDO RÁPIDO PARA COPIAR VARIABLES:"
echo "=========================================="
echo ""
echo "# Opción 1: Manual en el dashboard"
echo "railway open  # Luego ve a Variables y pégalas"
echo ""
echo "# Opción 2: Una por una desde terminal"
echo "railway variables set DATABASE_URL=\"postgresql://...\""
echo "railway variables set JWT_SECRET=\"tu-secreto-seguro\""
echo "railway variables set NODE_ENV=\"production\""
echo "# etc..."
echo ""
echo "=========================================="
echo ""

# Mostrar si ya hay un proyecto linked
if railway status &> /dev/null; then
    success "Ya tienes un proyecto de Railway configurado"
    railway status
    echo ""
    warning "Si quieres desplegar ahora, ejecuta: railway up"
else
    info "Listo para crear el proyecto. Ejecuta: railway init"
fi

echo ""
echo "📖 Guía completa en: RAILWAY_DEPLOY.md"
echo ""
