const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateProfile() {
  const userId = 'cmgnu5lom0003f7ysj81n8o0t';

  const updatedProfile = await prisma.professionalProfile.update({
    where: { userId },
    data: { isActive: true },
  });

  console.log('✅ Perfil activado correctamente');
  console.log({
    name: updatedProfile.name,
    isActive: updatedProfile.isActive,
  });

  await prisma.$disconnect();
}

activateProfile().catch(console.error);
