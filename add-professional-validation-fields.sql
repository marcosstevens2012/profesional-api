-- MIGRATION: Add professional validation fields
-- This migration adds DNI, CUIT/CUIL, matricula, and titleDocumentUrl fields to ProfessionalProfile

-- Step 1: Add new columns to ProfessionalProfile table
ALTER TABLE "ProfessionalProfile" 
ADD COLUMN IF NOT EXISTS "dni" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "cuitCuil" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "matricula" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "titleDocumentUrl" TEXT;

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "ProfessionalProfile_dni_idx" ON "ProfessionalProfile"("dni");
CREATE INDEX IF NOT EXISTS "ProfessionalProfile_cuitCuil_idx" ON "ProfessionalProfile"("cuitCuil");

-- Verification queries
-- Check that columns were added
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'ProfessionalProfile' 
  AND column_name IN ('dni', 'cuitCuil', 'matricula', 'titleDocumentUrl');

-- Check that indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'ProfessionalProfile' 
  AND indexname LIKE '%dni%' OR indexname LIKE '%cuitCuil%';
