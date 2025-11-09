-- AlterTable
ALTER TABLE "professional_profiles" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "cuitCuil" TEXT,
ADD COLUMN     "dni" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "linkedIn" TEXT,
ADD COLUMN     "matricula" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "titleDocumentUrl" TEXT,
ADD COLUMN     "twitter" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "yearsOfExperience" INTEGER,
ALTER COLUMN "standardDuration" SET DEFAULT 60;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'Argentina',
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "preferences" JSONB,
ADD COLUMN     "province" TEXT;

-- CreateIndex
CREATE INDEX "professional_profiles_dni_idx" ON "professional_profiles"("dni");

-- CreateIndex
CREATE INDEX "professional_profiles_cuitCuil_idx" ON "professional_profiles"("cuitCuil");

-- CreateIndex
CREATE INDEX "profiles_city_idx" ON "profiles"("city");

-- CreateIndex
CREATE INDEX "profiles_province_idx" ON "profiles"("province");
