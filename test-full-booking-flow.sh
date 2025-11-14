#!/bin/bash

# Script para probar el flujo completo de reservas y depurar problemas

set -e

API_URL=${API_URL:-"http://localhost:3001/api"}

echo "🧪 PRUEBA COMPLETA DEL FLUJO DE RESERVAS"
echo "========================================"
echo ""

# Función para hacer peticiones curl con headers
make_request() {
    local method=$1
    local url=$2
    local token=$3
    local data=$4
    
    if [ -n "$data" ]; then
        curl -s -X $method "$API_URL$url" \
             -H "Authorization: Bearer $token" \
             -H "Content-Type: application/json" \
             -d "$data"
    else
        curl -s -X $method "$API_URL$url" \
             -H "Authorization: Bearer $token" \
             -H "Content-Type: application/json"
    fi
}

# Verificar si existen tokens en archivo temporal
if [ -f "/tmp/tokens.json" ]; then
    echo "✅ Usando tokens existentes de /tmp/tokens.json"
    CLIENT_TOKEN=$(jq -r '.clientToken' /tmp/tokens.json)
    PROFESSIONAL_TOKEN=$(jq -r '.professionalToken' /tmp/tokens.json)
else
    echo "❌ No se encontraron tokens en /tmp/tokens.json"
    echo "💡 Por favor ejecuta primero: node get-token.js"
    exit 1
fi

echo "🔍 1. Verificando reservas del cliente..."
echo "----------------------------------------"
CLIENT_BOOKINGS=$(make_request "GET" "/bookings/client/my-bookings" "$CLIENT_TOKEN")
echo "$CLIENT_BOOKINGS" | jq '.grouped | keys'

# Contar reservas por estado
CONFIRMED_COUNT=$(echo "$CLIENT_BOOKINGS" | jq '.grouped.confirmed | length')
IN_PROGRESS_COUNT=$(echo "$CLIENT_BOOKINGS" | jq '.grouped.in_progress | length')

echo ""
echo "📊 Resumen de estados de reservas:"
echo "   - CONFIRMED: $CONFIRMED_COUNT"
echo "   - IN_PROGRESS: $IN_PROGRESS_COUNT"

# Si hay reservas confirmadas o en progreso
if [ "$CONFIRMED_COUNT" -gt 0 ] || [ "$IN_PROGRESS_COUNT" -gt 0 ]; then
    echo ""
    echo "✅ El cliente DEBERÍA ver botón(es) de 'Unirse a la Reunión'"
    echo ""
    
    # Mostrar detalles de cada reserva que debería mostrar botón
    if [ "$CONFIRMED_COUNT" -gt 0 ]; then
        echo "🎥 Reservas CONFIRMED (deberían mostrar botón):"
        echo "$CLIENT_BOOKINGS" | jq -r '.grouped.confirmed[] | "   ID: \(.id), Sala: \(.jitsiRoom // "Sin sala"), Profesional: \(.professional.name)"'
    fi
    
    if [ "$IN_PROGRESS_COUNT" -gt 0 ]; then
        echo "🎥 Reservas IN_PROGRESS (deberían mostrar botón):"
        echo "$CLIENT_BOOKINGS" | jq -r '.grouped.in_progress[] | "   ID: \(.id), Sala: \(.jitsiRoom // "Sin sala"), Profesional: \(.professional.name)"'
    fi
    
    # Probar acceso a reunión para la primera reserva disponible
    FIRST_BOOKING_ID=""
    if [ "$CONFIRMED_COUNT" -gt 0 ]; then
        FIRST_BOOKING_ID=$(echo "$CLIENT_BOOKINGS" | jq -r '.grouped.confirmed[0].id')
    elif [ "$IN_PROGRESS_COUNT" -gt 0 ]; then
        FIRST_BOOKING_ID=$(echo "$CLIENT_BOOKINGS" | jq -r '.grouped.in_progress[0].id')
    fi
    
    if [ -n "$FIRST_BOOKING_ID" ] && [ "$FIRST_BOOKING_ID" != "null" ]; then
        echo ""
        echo "🧪 2. Probando acceso a reunión (ID: $FIRST_BOOKING_ID)..."
        echo "--------------------------------------------------------"
        
        # Verificar si puede unirse
        CAN_JOIN=$(make_request "GET" "/bookings/$FIRST_BOOKING_ID/join-meeting" "$CLIENT_TOKEN")
        echo "Resultado de join-meeting:"
        echo "$CAN_JOIN" | jq '.'
        
        # Verificar estado de la reunión
        echo ""
        echo "Estado actual de la reunión:"
        MEETING_STATUS=$(make_request "GET" "/bookings/$FIRST_BOOKING_ID/meeting-status" "$CLIENT_TOKEN")
        echo "$MEETING_STATUS" | jq '.'
        
        # Probar iniciar reunión (si está disponible)
        CAN_JOIN_VALUE=$(echo "$CAN_JOIN" | jq -r '.canJoin')
        if [ "$CAN_JOIN_VALUE" = "true" ]; then
            echo ""
            echo "✅ El cliente PUEDE unirse a la reunión"
            echo "🚀 Probando iniciar reunión..."
            
            START_RESULT=$(make_request "POST" "/bookings/$FIRST_BOOKING_ID/start-meeting" "$CLIENT_TOKEN" "{}")
            echo "Resultado de start-meeting:"
            echo "$START_RESULT" | jq '.'
        else
            echo ""
            echo "❌ El cliente NO puede unirse a la reunión"
            echo "   Motivo: $(echo "$CAN_JOIN" | jq -r '.message // "Motivo no especificado"')"
        fi
    fi
    
else
    echo ""
    echo "❌ El cliente NO debería ver botón de 'Unirse a la Reunión'"
    echo ""
    echo "🔍 3. Verificando reservas pendientes de aceptación..."
    echo "---------------------------------------------------"
    
    WAITING_COUNT=$(echo "$CLIENT_BOOKINGS" | jq '.grouped.waiting_acceptance | length')
    echo "   - Esperando aceptación del profesional: $WAITING_COUNT"
    
    if [ "$WAITING_COUNT" -gt 0 ]; then
        echo ""
        echo "💡 ACCIÓN REQUERIDA:"
        echo "   El profesional debe aceptar las consultas pendientes."
        echo ""
        echo "📋 Reservas esperando aceptación:"
        echo "$CLIENT_BOOKINGS" | jq -r '.grouped.waiting_acceptance[] | "   ID: \(.id), Profesional: \(.professional.name), Fecha: \(.scheduledAt)"'
        
        # Mostrar reservas pendientes del profesional
        echo ""
        echo "🔍 4. Verificando pendientes del profesional..."
        echo "----------------------------------------------"
        
        PROFESSIONAL_PENDING=$(make_request "GET" "/bookings/professional/waiting-bookings" "$PROFESSIONAL_TOKEN")
        PENDING_COUNT=$(echo "$PROFESSIONAL_PENDING" | jq '.count')
        echo "   Reservas esperando aceptación: $PENDING_COUNT"
        
        if [ "$PENDING_COUNT" -gt 0 ]; then
            FIRST_PENDING_ID=$(echo "$PROFESSIONAL_PENDING" | jq -r '.bookings[0].id')
            echo ""
            echo "🚀 Aceptando automáticamente la primera reserva pendiente (ID: $FIRST_PENDING_ID)..."
            
            ACCEPT_RESULT=$(make_request "PATCH" "/bookings/$FIRST_PENDING_ID/accept-meeting" "$PROFESSIONAL_TOKEN" "{}")
            echo "Resultado:"
            echo "$ACCEPT_RESULT" | jq '.'
            
            echo ""
            echo "✅ ¡Reserva aceptada! Ahora verifica nuevamente en el panel del cliente."
        fi
    else
        echo ""
        echo "🤔 No hay reservas esperando aceptación."
        echo "   Verifica el estado de todas las reservas:"
        echo "$CLIENT_BOOKINGS" | jq '.grouped'
    fi
fi

echo ""
echo "🎯 RESUMEN Y PRÓXIMOS PASOS:"
echo "==========================="
echo "1. Verifica el panel del cliente en: http://localhost:3000/panel"
echo "2. Si no ves botones, actualiza la página (F5)"
echo "3. Revisa la consola del navegador para errores JavaScript"
echo "4. Ejecuta este script nuevamente para ver cambios de estado"
echo ""

# Crear archivo de debug con timestamp para referencia
DEBUG_FILE="/tmp/booking_debug_$(date +%Y%m%d_%H%M%S).json"
echo "$CLIENT_BOOKINGS" > "$DEBUG_FILE"
echo "📁 Debug guardado en: $DEBUG_FILE"