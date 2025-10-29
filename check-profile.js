const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProfile() {
  const profile = await prisma.professionalProfile.findFirst({
    where: { userId: 'cmhbxxp42000432nnlb6idd2r' },
    select: {
      id: true,
      userId: true,
      email: true,
      name: true,
      bio: true,
      description: true,
      isVerified: true,
      isActive: true,
    }
  });
  
  console.log('Professional Profile:');
  console.log(JSON.stringify(profile, null, 2));
  
  await prisma.$disconnect();
}

checkProfile();
