-- Crear bucket para documentos profesionales en Supabase Storage
-- Ejecutar esto en el SQL Editor de Supabase

-- 1. Crear el bucket (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('professional-documents', 'professional-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear políticas de seguridad para el bucket

-- Política: Los profesionales pueden subir sus propios documentos
CREATE POLICY "Professionals can upload their documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'professional-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Los profesionales pueden ver sus propios documentos
CREATE POLICY "Professionals can view their documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'professional-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Los profesionales pueden actualizar sus propios documentos
CREATE POLICY "Professionals can update their documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'professional-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Los profesionales pueden eliminar sus propios documentos
CREATE POLICY "Professionals can delete their documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'professional-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Los admins pueden ver todos los documentos
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'professional-documents'
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
  )
);
