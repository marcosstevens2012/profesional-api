const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createProfessionalProfile() {
  const userId = 'cmgnu5lom0003f7ysj81n8o0t';
  const email = 'marcosstevens2012@gmail.com';
  
  // Buscar una categoría por defecto
  const defaultCategory = await prisma.serviceCategory.findFirst({
    orderBy: { order: 'asc' },
  });

  // Buscar una ubicación por defecto
  const defaultLocation = await prisma.location.findFirst();

  if (!defaultCategory || !defaultLocation) {
    console.log('Error: No se encontraron categorías o ubicaciones disponibles');
    await prisma.$disconnect();
    return;
  }

  console.log('Using default category:', defaultCategory.name);
  console.log('Using default location:', `${defaultLocation.city}, ${defaultLocation.country}`);

  // Crear el ProfessionalProfile
  const profile = await prisma.professionalProfile.create({
    data: {
      userId: userId,
      email: email,
      name: 'Marcos Stevens',
      bio: null,
      description: null,
      pricePerSession: 25000.0,
      standardDuration: 60,
      serviceCategoryId: defaultCategory.id,
      locationId: defaultLocation.id,
      isVerified: false,
      isActive: false,
    },
  });

  console.log('\n✅ ProfessionalProfile created successfully!');
  console.log({
    id: profile.id,
    userId: profile.userId,
    email: profile.email,
    name: profile.name,
    isVerified: profile.isVerified,
    isActive: profile.isActive,
  });

  await prisma.$disconnect();
}

createProfessionalProfile();
