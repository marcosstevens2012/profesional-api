-- Actualizar el precio fijo de todos los profesionales a 25000 pesos argentinos
UPDATE professional_profiles
SET "pricePerSession" = 25000.00
WHERE "pricePerSession" != 25000.00;

-- Confirmar la actualización
SELECT
  id,
  name,
  "pricePerSession"
FROM professional_profiles
ORDER BY name;
