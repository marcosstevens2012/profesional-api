#!/bin/bash

# Script de Testing del Flujo de Bookings
# ========================================

echo "🧪 Testing Booking Flow"
echo "======================="
echo ""

# Configuración
API_URL="http://localhost:3000/api"
CLIENT_TOKEN="YOUR_CLIENT_TOKEN_HERE"
PROFESSIONAL_TOKEN="YOUR_PROFESSIONAL_TOKEN_HERE"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📌 Paso 1: Ver bookings esperando aceptación (Profesional)"
echo "------------------------------------------------------------"
curl -s -X GET "$API_URL/bookings/professional/waiting-bookings" \
  -H "Authorization: Bearer $PROFESSIONAL_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

read -p "Presiona Enter para continuar..."
echo ""

echo "📌 Paso 2: Aceptar un booking (usar ID del paso anterior)"
echo "------------------------------------------------------------"
read -p "Ingresa el Booking ID: " BOOKING_ID

curl -s -X PATCH "$API_URL/bookings/$BOOKING_ID/accept-meeting" \
  -H "Authorization: Bearer $PROFESSIONAL_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

read -p "Presiona Enter para continuar..."
echo ""

echo "📌 Paso 3: Ver bookings del cliente"
echo "------------------------------------------------------------"
curl -s -X GET "$API_URL/bookings/client/my-bookings" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" | jq '.grouped'
echo ""

read -p "Presiona Enter para continuar..."
echo ""

echo "📌 Paso 4: Verificar si puede unirse a la reunión (Cliente)"
echo "------------------------------------------------------------"
curl -s -X GET "$API_URL/bookings/$BOOKING_ID/join-meeting" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

read -p "Presiona Enter para continuar..."
echo ""

echo "📌 Paso 5: Iniciar la reunión (Cliente)"
echo "------------------------------------------------------------"
curl -s -X POST "$API_URL/bookings/$BOOKING_ID/start-meeting" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

read -p "Presiona Enter para continuar..."
echo ""

echo "📌 Paso 6: Ver estado de la reunión"
echo "------------------------------------------------------------"
curl -s -X GET "$API_URL/bookings/$BOOKING_ID/meeting-status" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

echo ""
echo "✅ Testing completado!"
echo "====================="
echo ""
echo "Notas:"
echo "- La reunión se finalizará automáticamente en 18 minutos"
echo "- Puedes verificar el estado con: GET /api/bookings/$BOOKING_ID"
echo ""
