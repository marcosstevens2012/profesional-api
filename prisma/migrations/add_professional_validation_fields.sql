-- Add professional validation fields to ProfessionalProfile table

ALTER TABLE "professional_profiles" 
  ADD COLUMN IF NOT EXISTS "dni" TEXT,
  ADD COLUMN IF NOT EXISTS "cuitCuil" TEXT,
  ADD COLUMN IF NOT EXISTS "matricula" TEXT,
  ADD COLUMN IF NOT EXISTS "titleDocumentUrl" TEXT;

-- Create indexes for dni and cuitCuil for faster lookups
CREATE INDEX IF NOT EXISTS "professional_profiles_dni_idx" ON "professional_profiles"("dni");
CREATE INDEX IF NOT EXISTS "professional_profiles_cuitCuil_idx" ON "professional_profiles"("cuitCuil");

-- Add comments to document the fields
COMMENT ON COLUMN "professional_profiles"."dni" IS 'Documento Nacional de Identidad (obligatorio)';
COMMENT ON COLUMN "professional_profiles"."cuitCuil" IS 'CUIT/CUIL number (obligatorio)';
COMMENT ON COLUMN "professional_profiles"."matricula" IS 'Professional license/registration number (opcional)';
COMMENT ON COLUMN "professional_profiles"."titleDocumentUrl" IS 'URL to professional title document photo/PDF (opcional)';
