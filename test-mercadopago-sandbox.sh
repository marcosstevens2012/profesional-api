#!/bin/bash

# Script para probar la creación de preferencias con MercadoPago en modo Sandbox
# Este script crea una preferencia de pago y retorna la URL de pago

echo "🧪 Testing MercadoPago Sandbox Preference Creation"
echo "=================================================="
echo ""

# Verificar que el servidor esté corriendo
echo "1️⃣ Checking if API server is running..."
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ API server is not running on http://localhost:3001"
    echo "   Please start the server first with: npm run start:dev"
    exit 1
fi
echo "✅ API server is running"
echo ""

# Verificar configuración de MercadoPago
echo "2️⃣ Checking MercadoPago configuration..."
CONFIG_RESPONSE=$(curl -s http://localhost:3001/api/payments/config-check)
echo "$CONFIG_RESPONSE" | jq '.'
echo ""

IS_SANDBOX=$(echo "$CONFIG_RESPONSE" | jq -r '.config.is_sandbox')
if [ "$IS_SANDBOX" != "true" ]; then
    echo "⚠️  WARNING: Not in sandbox mode! This script is for testing only."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# Crear una preferencia de pago de prueba
echo "3️⃣ Creating test payment preference..."
PREFERENCE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/payments/mp/preference \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Consulta de Prueba",
    "amount": 25000,
    "professionalSlug": "test-professional",
    "external_reference": "test_'$(date +%s)'",
    "payerEmail": "test_user_123@testuser.com",
    "payerName": "Test",
    "payerSurname": "User"
  }')

echo "$PREFERENCE_RESPONSE" | jq '.'
echo ""

# Extraer la URL de pago
PAYMENT_URL=$(echo "$PREFERENCE_RESPONSE" | jq -r '.init_point // .sandbox_init_point')

if [ "$PAYMENT_URL" = "null" ] || [ -z "$PAYMENT_URL" ]; then
    echo "❌ Failed to create preference"
    echo "Response: $PREFERENCE_RESPONSE"
    exit 1
fi

echo "✅ Preference created successfully!"
echo ""
echo "📱 Payment URL:"
echo "$PAYMENT_URL"
echo ""
echo "🎯 Next Steps:"
echo "1. Open the URL above in your browser"
echo "2. Use one of these TEST CARDS:"
echo ""
echo "   ✅ APPROVED - Mastercard:"
echo "   Card: 5031 7557 3453 0604"
echo "   CVV: 123"
echo "   Expiry: Any future date"
echo "   Name: APRO"
echo ""
echo "   ✅ APPROVED - Visa:"
echo "   Card: 4509 9535 6623 3704"
echo "   CVV: 123"
echo "   Expiry: Any future date"
echo "   Name: APRO"
echo ""
echo "   ❌ REJECTED - Visa:"
echo "   Card: 4774 4612 9001 0078"
echo "   CVV: 123"
echo "   Expiry: Any future date"
echo "   Name: Any name"
echo ""
echo "3. After completing payment, click 'Volver al sitio'"
echo "   (Auto-return is disabled for localhost)"
echo ""
echo "📊 Monitor the webhook at: http://localhost:3001/api/payments/webhook"
echo ""
