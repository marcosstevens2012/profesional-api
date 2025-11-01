-- MIGRATION: Add client and professional profile fields
-- This migration adds comprehensive fields for both client (Profile) and professional (ProfessionalProfile) users

-- ========== PROFILE TABLE (Clients) ==========
-- Add client-specific fields to Profile table

ALTER TABLE "profiles" 
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "gender" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "address" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "city" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "province" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "postalCode" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "country" VARCHAR(100) DEFAULT 'Argentina',
ADD COLUMN IF NOT EXISTS "emergencyContactName" VARCHAR(200),
ADD COLUMN IF NOT EXISTS "emergencyContactPhone" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "preferences" JSONB;

-- Create indexes for better query performance on Profile
CREATE INDEX IF NOT EXISTS "profiles_city_idx" ON "profiles"("city");
CREATE INDEX IF NOT EXISTS "profiles_province_idx" ON "profiles"("province");

-- ========== PROFESSIONAL PROFILE TABLE ==========
-- Add professional-specific fields to ProfessionalProfile table

ALTER TABLE "professional_profiles" 
ADD COLUMN IF NOT EXISTS "avatar" TEXT,
ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "website" TEXT,
ADD COLUMN IF NOT EXISTS "linkedIn" TEXT,
ADD COLUMN IF NOT EXISTS "instagram" TEXT,
ADD COLUMN IF NOT EXISTS "facebook" TEXT,
ADD COLUMN IF NOT EXISTS "twitter" TEXT,
ADD COLUMN IF NOT EXISTS "education" TEXT,
ADD COLUMN IF NOT EXISTS "experience" TEXT,
ADD COLUMN IF NOT EXISTS "specialties" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "languages" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "yearsOfExperience" INTEGER;

-- Set default value for standardDuration if it's NULL
UPDATE "professional_profiles" 
SET "standardDuration" = 60 
WHERE "standardDuration" IS NULL;

-- Verification queries
-- Check that columns were added to Profile
SELECT column_name, data_type, character_maximum_length, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('bio', 'dateOfBirth', 'gender', 'address', 'city', 'province', 'postalCode', 'country', 'emergencyContactName', 'emergencyContactPhone', 'preferences')
ORDER BY ordinal_position;

-- Check that columns were added to ProfessionalProfile
SELECT column_name, data_type, character_maximum_length, column_default
FROM information_schema.columns 
WHERE table_name = 'professional_profiles' 
  AND column_name IN ('avatar', 'phone', 'website', 'linkedIn', 'instagram', 'facebook', 'twitter', 'education', 'experience', 'specialties', 'languages', 'yearsOfExperience')
ORDER BY ordinal_position;

-- Check that indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('profiles', 'professional_profiles')
  AND (indexname LIKE '%city%' OR indexname LIKE '%province%')
ORDER BY tablename, indexname;
