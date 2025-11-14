#!/usr/bin/env node

/**
 * Script para sincronizar manualmente pagos con MercadoPago
 * cuando los webhooks no están funcionando correctamente
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncWithMercadoPago() {
  console.log('🔄 SINCRONIZACIÓN CON MERCADOPAGO');
  console.log('=================================\n');

  const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!MERCADOPAGO_ACCESS_TOKEN) {
    console.error('❌ MERCADOPAGO_ACCESS_TOKEN no está configurado');
    return;
  }

  try {
    // 1. Obtener pagos pendientes recientes (últimos 7 días)
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días
        },
        preferenceId: {
          not: null,
        },
      },
      include: {
        booking: {
          include: {
            client: { select: { name: true } },
            professional: { select: { name: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Limitar a los 20 más recientes
    });

    console.log(`📋 Verificando ${pendingPayments.length} pagos pendientes...\n`);

    if (pendingPayments.length === 0) {
      console.log('✅ No hay pagos pendientes para verificar');
      return;
    }

    const updatedPayments = [];
    const stillPending = [];

    for (const payment of pendingPayments) {
      console.log(`🔍 Verificando pago ${payment.id.slice(-8)}...`);
      console.log(`   Cliente: ${payment.booking.client.name}`);
      console.log(`   Profesional: ${payment.booking.professional.name}`);
      console.log(`   Preference ID: ${payment.preferenceId}`);

      try {
        // Obtener información de la preferencia
        const preferenceResponse = await fetch(
          `https://api.mercadopago.com/checkout/preferences/${payment.preferenceId}`,
          {
            headers: {
              Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
            },
          },
        );

        if (!preferenceResponse.ok) {
          console.log(`   ❌ Error consultando preferencia: ${preferenceResponse.status}`);
          continue;
        }

        const preference = await preferenceResponse.json();
        console.log(`   📋 External Reference: ${preference.external_reference}`);

        // Buscar pagos asociados a esta preferencia
        const searchResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/search?external_reference=${preference.external_reference}`,
          {
            headers: {
              Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
            },
          },
        );

        if (!searchResponse.ok) {
          console.log(`   ❌ Error buscando pagos: ${searchResponse.status}`);
          continue;
        }

        const searchResults = await searchResponse.json();
        const mpPayments = searchResults.results || [];

        console.log(`   📊 Pagos encontrados en MP: ${mpPayments.length}`);

        if (mpPayments.length === 0) {
          console.log(`   ⏳ Sin pagos en MP - aún pendiente\n`);
          stillPending.push(payment);
          continue;
        }

        // Buscar el pago más reciente que esté aprobado
        const approvedPayment = mpPayments.find((p) => p.status === 'approved');

        if (!approvedPayment) {
          console.log(`   ⏳ Sin pagos aprobados en MP\n`);
          stillPending.push(payment);
          continue;
        }

        console.log(`   ✅ Pago aprobado encontrado: ${approvedPayment.id}`);
        console.log(`   💰 Estado: ${approvedPayment.status}`);
        console.log(`   💵 Monto: $${approvedPayment.transaction_amount}`);
        console.log(`   📅 Fecha: ${approvedPayment.date_approved}`);

        // Actualizar nuestro pago
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paymentId: approvedPayment.id.toString(),
            gatewayPaymentId: approvedPayment.id.toString(),
            paidAt: new Date(approvedPayment.date_approved),
            netAmount: approvedPayment.transaction_amount,
            gatewayFees:
              approvedPayment.fee_details?.reduce((sum, fee) => sum + fee.amount, 0) || 0,
            updatedAt: new Date(),
            metadata: {
              ...(payment.metadata || {}),
              mercadoPagoData: {
                paymentMethodId: approvedPayment.payment_method_id,
                installments: approvedPayment.installments,
                transactionAmount: approvedPayment.transaction_amount,
                dateApproved: approvedPayment.date_approved,
              },
            },
          },
        });

        // Actualizar el booking
        await prisma.booking.update({
          where: { id: payment.booking.id },
          data: {
            status: 'WAITING_FOR_PROFESSIONAL',
            meetingStatus: 'WAITING',
            updatedAt: new Date(),
          },
        });

        console.log(`   ✅ Pago actualizado a COMPLETED`);
        console.log(`   ✅ Booking actualizado a WAITING_FOR_PROFESSIONAL\n`);

        updatedPayments.push({
          paymentId: payment.id,
          bookingId: payment.booking.id,
          mpPaymentId: approvedPayment.id,
          amount: approvedPayment.transaction_amount,
        });
      } catch (error) {
        console.log(`   ❌ Error procesando: ${error.message}\n`);
      }
    }

    // Resumen
    console.log('\n📊 RESUMEN DE SINCRONIZACIÓN:');
    console.log('=============================');
    console.log(`✅ Pagos sincronizados: ${updatedPayments.length}`);
    console.log(`⏳ Pagos aún pendientes: ${stillPending.length}`);

    if (updatedPayments.length > 0) {
      console.log('\n💰 PAGOS SINCRONIZADOS:');
      updatedPayments.forEach((p) => {
        console.log(`   - Pago: ${p.paymentId.slice(-8)} → MP: ${p.mpPaymentId} ($${p.amount})`);
      });
    }

    if (stillPending.length > 0) {
      console.log('\n⏳ PAGOS AÚN PENDIENTES:');
      stillPending.forEach((p) => {
        console.log(
          `   - ${p.id.slice(-8)}: ${p.booking.client.name} → ${p.booking.professional.name}`,
        );
      });
    }

    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('==================');
    if (updatedPayments.length > 0) {
      console.log('1. ✅ Los clientes deberían ver sus reservas actualizadas');
      console.log('2. 📱 Los profesionales deberían tener notificaciones');
      console.log('3. 🧪 Ejecuta: ./test-full-booking-flow.sh para verificar');
    }

    if (stillPending.length > 0) {
      console.log('4. ⏳ Los pagos pendientes pueden ser:');
      console.log('   - Abandonados (usuario no completó el pago)');
      console.log('   - En proceso de autorización');
      console.log('   - Con problemas en MercadoPago');
    }
  } catch (error) {
    console.error('❌ Error en la sincronización:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  syncWithMercadoPago();
}

module.exports = { syncWithMercadoPago };
