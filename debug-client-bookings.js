#!/usr/bin/env node

/**
 * Script para depurar las reservas del cliente y verificar por qué no aparece el botón de unirse
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function debugClientBookings() {
  console.log('🔍 DEBUG: Verificando reservas del cliente');
  console.log('=====================================\n');

  try {
    // Obtener el token del cliente desde las variables de entorno o prompt
    let clientToken = process.env.CLIENT_TOKEN;

    if (!clientToken) {
      console.log('❌ No se encontró CLIENT_TOKEN en las variables de entorno');
      console.log('💡 Ejecuta primero: source get-token.js para obtener tokens\n');

      // Intentar obtener token del archivo temporal si existe
      try {
        const fs = require('fs');
        const tokens = JSON.parse(fs.readFileSync('/tmp/tokens.json', 'utf8'));
        clientToken = tokens.clientToken;
        console.log('✅ Token obtenido del archivo temporal');
      } catch {
        console.log('❌ No se pudo obtener token automáticamente');
        console.log('📝 Por favor ejecuta primero el script de obtención de tokens');
        return;
      }
    }

    // Hacer petición para obtener las reservas del cliente
    const response = await fetch(`${API_URL}/api/bookings/client/my-bookings`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('❌ Error al obtener reservas del cliente:', response.status);
      const errorText = await response.text();
      console.log('Error:', errorText);
      return;
    }

    const data = await response.json();

    console.log('📊 Resumen de reservas:');
    console.log(`   Total: ${data.count}`);
    console.log(`   Agrupadas: ${Object.keys(data.grouped).length} categorías\n`);

    // Analizar cada grupo de reservas
    for (const [status, bookings] of Object.entries(data.grouped)) {
      console.log(`📋 Estado: ${status.toUpperCase()}`);
      console.log(`   Cantidad: ${bookings.length}`);

      if (bookings.length > 0) {
        console.log('   Reservas:');
        bookings.forEach((booking, index) => {
          console.log(`     ${index + 1}. ID: ${booking.id}`);
          console.log(`        Estado: ${booking.status}`);
          console.log(`        Estado reunión: ${booking.meetingStatus || 'N/A'}`);
          console.log(`        Sala Jitsi: ${booking.jitsiRoom || 'No asignada'}`);
          console.log(`        Profesional: ${booking.professional?.name || 'N/A'}`);

          // Verificar si debería mostrar botón de unirse
          const shouldShowJoinButton =
            (booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') &&
            booking.jitsiRoom;

          console.log(
            `        🎥 Debería mostrar botón unirse: ${shouldShowJoinButton ? '✅ SÍ' : '❌ NO'}`,
          );

          if (!shouldShowJoinButton) {
            const reasons = [];
            if (booking.status !== 'CONFIRMED' && booking.status !== 'IN_PROGRESS') {
              reasons.push(`Estado incorrecto: ${booking.status}`);
            }
            if (!booking.jitsiRoom) {
              reasons.push('Sin sala Jitsi asignada');
            }
            console.log(`        📝 Razones: ${reasons.join(', ')}`);
          }

          console.log('');
        });
      }
      console.log('');
    }

    // Verificar si hay alguna reserva que debería mostrar el botón
    const shouldShowButton = Object.values(data.grouped)
      .flat()
      .some(
        (booking) =>
          (booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') && booking.jitsiRoom,
      );

    console.log('🎯 CONCLUSIÓN:');
    console.log(
      `   ¿Debería haber botón de unirse visible? ${shouldShowButton ? '✅ SÍ' : '❌ NO'}`,
    );

    if (!shouldShowButton) {
      console.log('\n💡 POSIBLES SOLUCIONES:');
      console.log('   1. Verifica que el profesional haya aceptado la consulta');
      console.log('   2. Asegúrate de que el pago esté procesado');
      console.log('   3. Revisa que el booking tenga estado CONFIRMED o IN_PROGRESS');
      console.log('   4. Confirma que se haya asignado una sala Jitsi');
    } else {
      console.log('\n🔍 Si el botón no aparece pero debería:');
      console.log('   1. Revisa la caché del navegador');
      console.log('   2. Verifica que el hook useClientBookings esté funcionando');
      console.log('   3. Revisa los filtros en el componente ClientPanel');
    }
  } catch (error) {
    console.error('❌ Error ejecutando debug:', error.message);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  debugClientBookings();
}

module.exports = { debugClientBookings };
