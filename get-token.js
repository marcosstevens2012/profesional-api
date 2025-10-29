const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getToken() {
  const token = await prisma.verificationToken.findFirst({
    where: { userId: 'cmhbxxp42000432nnlb6idd2r' },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('Verification Token:', token ? token.token : 'NOT FOUND');
  
  await prisma.$disconnect();
}

getToken();
