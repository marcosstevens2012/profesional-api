const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findProfile() {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: 'cmgnu5lom0003f7ysj81n8o0t' },
  });
  
  if (profile) {
    console.log('✅ ProfessionalProfile FOUND:');
    console.log(JSON.stringify(profile, null, 2));
  } else {
    console.log('❌ ProfessionalProfile NOT FOUND');
  }
  
  await prisma.$disconnect();
}

findProfile();
