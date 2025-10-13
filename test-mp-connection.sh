#!/bin/bash

# Script para verificar la conexión con MercadoPago API
# Uso: ./test-mp-connection.sh [payment_id]

echo "🔍 Testing MercadoPago API Connection..."
echo ""

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Verificar que tenemos el access token
if [ -z "$MERCADOPAGO_ACCESS_TOKEN" ]; then
    echo "❌ ERROR: MERCADOPAGO_ACCESS_TOKEN no está configurado en .env"
    exit 1
fi

echo "✅ Access Token encontrado: ${MERCADOPAGO_ACCESS_TOKEN:0:20}..."
echo "🌐 Base URL: ${MERCADOPAGO_BASE_URL:-https://api.mercadopago.com}"
echo ""

# Payment ID por defecto o desde argumento
PAYMENT_ID=${1:-129198544875}

echo "🧪 Testing GET /v1/payments/$PAYMENT_ID"
echo ""

# Hacer la petición
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X GET \
    "${MERCADOPAGO_BASE_URL:-https://api.mercadopago.com}/v1/payments/$PAYMENT_ID" \
    -H "Authorization: Bearer $MERCADOPAGO_ACCESS_TOKEN" \
    -H "Content-Type: application/json")

# Separar el cuerpo del status code
HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "📊 HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ SUCCESS! Payment retrieved successfully"
    echo ""
    echo "Payment Data:"
    echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
elif [ "$HTTP_STATUS" -eq 401 ]; then
    echo "❌ ERROR 401: UNAUTHORIZED"
    echo "   - El access token es inválido o expirado"
    echo "   - Verifica MERCADOPAGO_ACCESS_TOKEN en .env"
    echo "   - Regenera el token en: https://www.mercadopago.com.ar/developers/panel"
    echo ""
    echo "Response:"
    echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
elif [ "$HTTP_STATUS" -eq 404 ]; then
    echo "❌ ERROR 404: NOT FOUND"
    echo "   - El payment ID $PAYMENT_ID no existe"
    echo "   - Puede ser que el pago aún no esté procesado en MP"
    echo "   - Verifica el ID en el dashboard de MercadoPago"
    echo ""
    echo "Response:"
    echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
else
    echo "❌ ERROR $HTTP_STATUS"
    echo ""
    echo "Response:"
    echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
fi

echo ""
echo "---"
echo ""

# Test adicional: obtener account info
echo "🔍 Testing account info..."
ACCOUNT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X GET \
    "${MERCADOPAGO_BASE_URL:-https://api.mercadopago.com}/users/me" \
    -H "Authorization: Bearer $MERCADOPAGO_ACCESS_TOKEN")

ACCOUNT_STATUS=$(echo "$ACCOUNT_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

if [ "$ACCOUNT_STATUS" -eq 200 ]; then
    echo "✅ Access Token is VALID"
    echo ""
    ACCOUNT_BODY=$(echo "$ACCOUNT_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
    echo "Account Info:"
    echo "$ACCOUNT_BODY" | jq '{id, email, nickname, site_id}' 2>/dev/null || echo "$ACCOUNT_BODY"
else
    echo "❌ Access Token is INVALID or EXPIRED"
    echo "   Status: $ACCOUNT_STATUS"
fi

echo ""
echo "---"
echo "✅ Test completed"
