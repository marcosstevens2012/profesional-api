const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { id: 'cmhbxxp42000432nnlb6idd2r' },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      role: true,
    }
  });
  
  console.log('User Status:');
  console.log(JSON.stringify(user, null, 2));
  
  await prisma.$disconnect();
}

checkUser();
