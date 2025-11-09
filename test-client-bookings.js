const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Obtener el usuario cliente1@email.com
    const user = await prisma.user.findUnique({
      where: { email: 'cliente1@email.com' },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('\n👤 Usuario:', user.email);
    console.log('   ID:', user.id);
    console.log('   Rol:', user.role);

    // Obtener las bookings del cliente
    const bookings = await prisma.booking.findMany({
      where: {
        clientId: user.id,
      },
      include: {
        professional: {
          select: {
            id: true,
            email: true,
            bio: true,
            pricePerSession: true,
            userId: true,
            user: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
            serviceCategory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`\n📋 Bookings encontradas: ${bookings.length}`);
    
    bookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. Booking ID: ${booking.id}`);
      console.log(`   Estado: ${booking.status}`);
      console.log(`   Fecha: ${booking.scheduledAt}`);
      console.log(`   Precio: $${booking.price}`);
      console.log(`   Profesional:`, booking.professional?.user?.profile);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
