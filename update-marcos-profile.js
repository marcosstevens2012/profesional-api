const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateProfile() {
  const userId = 'cmgnu5lom0003f7ysj81n8o0t';

  const updatedProfile = await prisma.professionalProfile.update({
    where: { userId },
    data: {
      bio: 'Profesional con amplia experiencia en el sector',
      description:
        'Ofrezco servicios profesionales de alta calidad con años de experiencia en el área. Me especializo en brindar soluciones personalizadas a cada cliente, garantizando resultados excepcionales.',
    },
  });

  console.log('✅ Perfil actualizado correctamente:');
  console.log({
    bio: updatedProfile.bio,
    description: updatedProfile.description,
  });

  await prisma.$disconnect();
}

updateProfile().catch(console.error);
