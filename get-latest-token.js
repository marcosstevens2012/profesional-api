const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getLatestToken() {
  const user = await prisma.user.findUnique({
    where: { email: 'test.drakeflow@gmail.com' },
    select: { id: true, email: true, status: true }
  });
  
  if (!user) {
    console.log('Usuario no encontrado');
    await prisma.$disconnect();
    return;
  }
  
  console.log('User:', user);
  
  const token = await prisma.verificationToken.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });
  
  if (token) {
    console.log('\nVerification Token:', token.token);
    console.log('Verification URL:', `http://localhost:3000/verificar-email?token=${token.token}`);
  }
  
  await prisma.$disconnect();
}

getLatestToken();
