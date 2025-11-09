const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Count total bookings
    const totalBookings = await prisma.booking.count();
    console.log(`\n📊 Total de bookings: ${totalBookings}`);

    // Get all bookings with details
    const bookings = await prisma.booking.findMany({
      include: {
        client: {
          select: {
            id: true,
            email: true,
          },
        },
        professional: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      take: 10,
    });

    console.log('\n📋 Últimas 10 bookings:');
    bookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. Booking ID: ${booking.id}`);
      console.log(`   Cliente: ${booking.client.email} (ID: ${booking.clientId})`);
      console.log(`   Profesional: ${booking.professional.email} (ID: ${booking.professionalId})`);
      console.log(`   Estado: ${booking.status}`);
      console.log(`   Fecha: ${booking.scheduledAt}`);
      console.log(`   Precio: $${booking.price}`);
    });

    // Count users
    const totalUsers = await prisma.user.count();
    console.log(`\n👥 Total de usuarios: ${totalUsers}`);

    const clients = await prisma.user.count({ where: { role: 'CLIENT' } });
    const professionals = await prisma.user.count({ where: { role: 'PROFESSIONAL' } });

    console.log(`   Clientes: ${clients}`);
    console.log(`   Profesionales: ${professionals}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
