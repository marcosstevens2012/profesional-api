#!/bin/bash

# Login para obtener token
echo "🔐 Iniciando sesión..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "marcosstevens2012@gmail.com",
    "password": "Temporal123!"
  }')

# Extraer access token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Error al obtener token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido"
echo ""

# Probar endpoint /me
echo "📋 Probando GET /profiles/me..."
echo ""
curl -s -X GET http://localhost:3001/profiles/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "✅ Endpoint probado"
