-- AlterTable
ALTER TABLE "public"."professional_profiles" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "professional_profiles_isActive_idx" ON "public"."professional_profiles"("isActive");
