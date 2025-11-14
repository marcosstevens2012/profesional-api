#!/usr/bin/env node

/**
 * Script para corregir automáticamente los estados de reservas
 * que tienen pago completado pero estados incorrectos
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPaymentBookingStates() {
  console.log('🔧 CORRECCIÓN AUTOMÁTICA DE ESTADOS');
  console.log('===================================\n');

  try {
    // 1. Encontrar reservas con pago completado pero estado incorrecto
    const bookingsToFix = await prisma.booking.findMany({
      where: {
        payment: {
          status: 'COMPLETED',
        },
        status: 'PENDING_PAYMENT', // Estado incorrecto
      },
      include: {
        payment: true,
        client: { select: { name: true } },
        professional: { select: { name: true } },
      },
    });

    console.log(`📋 Reservas a corregir: ${bookingsToFix.length}\n`);

    if (bookingsToFix.length === 0) {
      console.log('✅ No se encontraron reservas que necesiten corrección');
      return;
    }

    console.log('🛠️  Corrigiendo estados...\n');

    for (const booking of bookingsToFix) {
      console.log(`📋 Corrigiendo reserva ${booking.id.slice(-8)}...`);
      console.log(`   Cliente: ${booking.client.name}`);
      console.log(`   Profesional: ${booking.professional.name}`);
      console.log(`   Estado actual: ${booking.status}`);
      console.log(`   Pago: $${booking.payment.amount} (${booking.payment.status})`);

      // Actualizar el booking al estado correcto
      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'WAITING_FOR_PROFESSIONAL', // El profesional debe aceptar
          meetingStatus: 'WAITING', // Reunión lista para ser aceptada
          updatedAt: new Date(),
        },
      });

      console.log(
        `   ✅ Actualizado a: ${updatedBooking.status} / ${updatedBooking.meetingStatus}\n`,
      );

      // Crear notificación para el profesional (si no existe ya)
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: booking.professional.userId,
          type: 'BOOKING_REQUEST',
          'payload.bookingId': booking.id,
        },
      });

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId: booking.professional.userId,
            type: 'BOOKING_REQUEST',
            title: 'Nueva solicitud de consulta',
            message: `Tienes una nueva solicitud de consulta pagada. El cliente ya realizó el pago de $${booking.payment.amount}.`,
            payload: {
              bookingId: booking.id,
              amount: booking.payment.amount.toString(),
              paymentId: booking.payment.id,
              clientId: booking.clientId,
            },
          },
        });
        console.log(`   🔔 Notificación creada para el profesional`);
      } else {
        console.log(`   📱 Notificación ya existía`);
      }
    }

    console.log(`\n✅ Corrección completada: ${bookingsToFix.length} reservas actualizadas\n`);

    // 2. Verificar si hay reservas que el profesional ya aceptó pero están mal
    console.log('🔍 Verificando reservas que deberían estar CONFIRMED...\n');

    const acceptedBookings = await prisma.booking.findMany({
      where: {
        status: 'WAITING_FOR_PROFESSIONAL',
        meetingAcceptedAt: {
          not: null, // El profesional ya aceptó
        },
      },
      include: {
        client: { select: { name: true } },
        professional: { select: { name: true } },
      },
    });

    console.log(`📋 Reservas ya aceptadas por profesional: ${acceptedBookings.length}\n`);

    for (const booking of acceptedBookings) {
      console.log(`📋 Actualizando reserva ya aceptada ${booking.id.slice(-8)}...`);

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED', // Ya puede unirse el cliente
          meetingStatus: 'ACCEPTED',
        },
      });

      console.log(`   ✅ Actualizada a CONFIRMED - cliente puede unirse\n`);
    }

    // 3. Resumen final
    console.log('\n📊 RESUMEN DE CORRECCIONES:');
    console.log('============================');
    console.log(`✅ Reservas movidas a WAITING_FOR_PROFESSIONAL: ${bookingsToFix.length}`);
    console.log(`✅ Reservas movidas a CONFIRMED: ${acceptedBookings.length}`);
    console.log(
      `📱 Notificaciones creadas: ${
        bookingsToFix.filter(async (b) => {
          const exists = await prisma.notification.findFirst({
            where: { 'payload.bookingId': b.id },
          });
          return !exists;
        }).length
      }`,
    );

    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('==================');
    console.log('1. El cliente debería ver sus reservas actualizadas');
    console.log('2. El profesional debería tener notificaciones de nuevas consultas');
    console.log('3. Ejecuta: ./test-full-booking-flow.sh para verificar');
  } catch (error) {
    console.error('❌ Error en la corrección:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  fixPaymentBookingStates();
}

module.exports = { fixPaymentBookingStates };
