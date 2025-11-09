const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMeetingStatus() {
  try {
    console.log('🔧 Fixing meetingStatus for WAITING_FOR_PROFESSIONAL bookings...');
    
    // Buscar bookings que están esperando aceptación pero tienen meetingStatus PENDING
    const bookingsToFix = await prisma.booking.findMany({
      where: {
        status: 'WAITING_FOR_PROFESSIONAL',
        meetingStatus: 'PENDING',
      },
      include: {
        payment: {
          select: {
            status: true
          }
        }
      }
    });
    
    console.log(`Found ${bookingsToFix.length} bookings to fix`);
    
    if (bookingsToFix.length > 0) {
      // Actualizar solo las que tienen pago aprobado
      const withApprovedPayment = bookingsToFix.filter(b => 
        b.payment && (b.payment.status === 'COMPLETED' || b.payment.status === 'APPROVED')
      );
      
      console.log(`Bookings with approved payment: ${withApprovedPayment.length}`);
      
      for (const booking of withApprovedPayment) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            meetingStatus: 'WAITING'
          }
        });
        console.log(`✅ Fixed booking ${booking.id.slice(-8)} - set meetingStatus to WAITING`);
      }
      
      console.log(`\n✅ Updated ${withApprovedPayment.length} bookings`);
    } else {
      console.log('No bookings to fix');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMeetingStatus();
