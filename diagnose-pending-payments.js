#!/usr/bin/env node

/**
 * Script para diagnosticar y corregir problemas de sincronización
 * entre pagos de MercadoPago y estados de reservas
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnosePendingPayments() {
  console.log('🔍 DIAGNÓSTICO DE PAGOS PENDIENTES');
  console.log('=====================================\n');

  try {
    // 1. Buscar bookings con pago COMPLETED pero estado incorrecto
    const bookingsWithPaidButWrongStatus = await prisma.booking.findMany({
      where: {
        payment: {
          status: 'COMPLETED',
        },
        status: {
          in: ['PENDING_PAYMENT'], // Estados incorrectos cuando el pago está completado
        },
      },
      include: {
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            paidAt: true,
            paymentId: true,
          },
        },
        client: {
          select: { id: true, name: true, email: true },
        },
        professional: {
          select: {
            id: true,
            name: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    console.log(
      `📊 Reservas con pago completado pero estado incorrecto: ${bookingsWithPaidButWrongStatus.length}\n`,
    );

    if (bookingsWithPaidButWrongStatus.length > 0) {
      console.log('🚨 PROBLEMAS ENCONTRADOS:');
      console.log('========================');

      for (const booking of bookingsWithPaidButWrongStatus) {
        console.log(`\n📋 Reserva ID: ${booking.id}`);
        console.log(`   Cliente: ${booking.client.name} (${booking.client.email})`);
        console.log(`   Profesional: ${booking.professional.name}`);
        console.log(`   Estado actual: ${booking.status}`);
        console.log(`   Estado de pago: ${booking.payment.status}`);
        console.log(`   Monto pagado: $${booking.payment.amount}`);
        console.log(
          `   Fecha de pago: ${booking.payment.paidAt ? new Date(booking.payment.paidAt).toLocaleString() : 'N/A'}`,
        );
        console.log(`   ID de MercadoPago: ${booking.payment.paymentId || 'N/A'}`);

        // Determinar el estado correcto
        const shouldBeStatus = 'WAITING_FOR_PROFESSIONAL';
        const shouldBeMeetingStatus = 'WAITING';

        console.log(`   ✅ Debería estar en: ${shouldBeStatus} / ${shouldBeMeetingStatus}`);
      }
    }

    // 2. Buscar pagos PENDING que deberían estar COMPLETED
    console.log('\n🔍 Verificando pagos que pueden estar desactualizados...');

    const paymentsToCheck = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lte: new Date(Date.now() - 10 * 60 * 1000), // Más de 10 minutos
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            client: { select: { name: true, email: true } },
            professional: { select: { name: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    console.log(`📊 Pagos pendientes por más de 10 minutos: ${paymentsToCheck.length}\n`);

    if (paymentsToCheck.length > 0) {
      console.log('⏳ PAGOS POSIBLEMENTE DESACTUALIZADOS:');
      console.log('====================================');

      for (const payment of paymentsToCheck) {
        console.log(`\n💳 Pago ID: ${payment.id}`);
        console.log(`   Booking: ${payment.booking.id}`);
        console.log(`   Cliente: ${payment.booking.client.name}`);
        console.log(`   Estado: ${payment.status}`);
        console.log(`   Creado: ${new Date(payment.createdAt).toLocaleString()}`);
        console.log(`   MercadoPago ID: ${payment.paymentId || 'Pendiente'}`);
        console.log(`   Preference ID: ${payment.preferenceId}`);
      }
    }

    // 3. Verificar si hay webhooks fallidos
    const failedWebhooks = await prisma.paymentEvent.findMany({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    console.log(`\n🚨 Webhooks fallidos en las últimas 24h: ${failedWebhooks.length}`);

    if (failedWebhooks.length > 0) {
      console.log('\n💥 WEBHOOKS FALLIDOS:');
      console.log('====================');

      for (const webhook of failedWebhooks) {
        console.log(`\n🔔 Webhook ID: ${webhook.id}`);
        console.log(`   Tipo: ${webhook.eventType}`);
        console.log(`   Data ID: ${webhook.dataId}`);
        console.log(`   Error: ${webhook.errorMessage || 'No especificado'}`);
        console.log(`   Fecha: ${new Date(webhook.createdAt).toLocaleString()}`);
      }
    }

    // 4. Sugerir acciones correctivas
    console.log('\n\n🛠️  ACCIONES RECOMENDADAS:');
    console.log('===========================');

    if (bookingsWithPaidButWrongStatus.length > 0) {
      console.log('1. ✅ Ejecutar corrección automática de estados:');
      console.log('   node fix-payment-booking-states.js');
      console.log('');
    }

    if (paymentsToCheck.length > 0) {
      console.log('2. 🔄 Verificar pagos pendientes manualmente en MercadoPago:');
      paymentsToCheck.slice(0, 3).forEach((payment) => {
        if (payment.paymentId) {
          console.log(`   curl -H "Authorization: Bearer $MERCADOPAGO_ACCESS_TOKEN" \\`);
          console.log(`        "https://api.mercadopago.com/v1/payments/${payment.paymentId}"`);
        }
      });
      console.log('');
    }

    if (failedWebhooks.length > 0) {
      console.log('3. 🔔 Reprocesar webhooks fallidos:');
      console.log('   node reprocess-failed-webhooks.js');
      console.log('');
    }

    console.log('4. 🧪 Probar flujo completo:');
    console.log('   ./test-full-booking-flow.sh');
    console.log('');

    console.log('5. 🔍 Monitorear logs en tiempo real:');
    console.log('   pm2 logs api --lines 100 --follow');
  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  diagnosePendingPayments();
}

module.exports = { diagnosePendingPayments };
