const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateProfile() {
  const userId = 'cmgnu5lom0003f7ysj81n8o0t';
  
  console.log('Updating profile and professional profile...\n');
  
  // Actualizar Profile
  const profile = await prisma.profile.update({
    where: { userId },
    data: {
      phone: '+543743562805',
      website: 'https://marcosstevens.online',
    },
  });
  
  console.log('✅ Profile updated:', {
    phone: profile.phone,
    website: profile.website,
  });
  
  // Actualizar ProfessionalProfile
  const professionalProfile = await prisma.professionalProfile.update({
    where: { userId },
    data: {
      bio: 'desarrollo de software y paginas web hace 8 años',
    },
  });
  
  console.log('\n✅ ProfessionalProfile updated:', {
    bio: professionalProfile.bio,
  });
  
  await prisma.$disconnect();
}

updateProfile();
