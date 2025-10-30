const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProfileEndpoint() {
  const userId = 'cmgnu5lom0003f7ysj81n8o0t';

  // Simular lo que hace el endpoint /api/profiles/me
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      },
      serviceCategory: true,
      location: true,
    },
  });

  console.log('📋 Profile data that endpoint /me should return:');
  console.log(JSON.stringify(profile, null, 2));

  console.log('\n✅ Validation:');
  console.log('bio exists:', !!profile?.bio);
  console.log('bio not empty:', profile?.bio?.trim() !== '');
  console.log('description exists:', !!profile?.description);
  console.log('description not empty:', profile?.description?.trim() !== '');

  const isComplete =
    profile?.bio &&
    profile?.description &&
    profile.bio.trim() !== '' &&
    profile.description.trim() !== '';

  console.log('\n🎯 Profile is complete:', isComplete);

  await prisma.$disconnect();
}

testProfileEndpoint().catch(console.error);
