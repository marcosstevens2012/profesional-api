const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'marcosstevens2012@gmail.com' },
    include: {
      profile: true,
      professionalProfile: true,
    }
  });
  
  if (!user) {
    console.log('Usuario no encontrado');
    await prisma.$disconnect();
    return;
  }
  
  console.log('User:', {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  });
  
  console.log('\nProfile:', user.profile ? 'EXISTS' : 'MISSING');
  console.log('ProfessionalProfile:', user.professionalProfile ? 'EXISTS' : 'MISSING');
  
  await prisma.$disconnect();
}

checkUser();
