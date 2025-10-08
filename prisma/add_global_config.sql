-- Migration para configuración global de precios
-- Agregar tabla de configuración global
CREATE TABLE "global_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_config_pkey" PRIMARY KEY ("id")
);

-- Crear índices
CREATE UNIQUE INDEX "global_config_key_key" ON "global_config"("key");
CREATE INDEX "global_config_key_idx" ON "global_config"("key");

-- Insertar precio fijo por defecto
INSERT INTO "global_config" ("id", "key", "value", "description", "created_at", "updated_at") VALUES
(gen_random_uuid()::text, 'consultation_price', '{"amount": 25000, "currency": "ARS"}', 'Precio fijo para todas las consultas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Opcional: También podemos mantener el campo pricePerSession para compatibilidad hacia atrás
-- pero lo marcaremos como deprecado en el schema y no lo usaremos en el frontend
