# PROBLEMA RESUELTO: Error "Maximum call stack size exceeded" en Prisma

## Causa Raíz
El archivo `.env` contenía variables de entorno con **autorreferencias** que causaban una recursión infinita cuando Prisma intentaba parsear el archivo.

### Variables Problemáticas
```env
JWT_SECRET=${JWT_SECRET}
CORS_ORIGINS=${CORS_ORIGINS}
SENTRY_DSN=${SENTRY_DSN}
SUPABASE_URL=${SUPABASE_URL}
# etc...
```

Estas variables se autorreferenciaban, creando un bucle infinito en el parser de Prisma.

## Solución
Reemplazar todas las autorreferencias con valores reales o placeholders:

```env
# ❌ INCORRECTO (causa stack overflow)
JWT_SECRET=${JWT_SECRET}

# ✅ CORRECTO
JWT_SECRET="your-secret-key-here-change-in-production"
```

## Archivos Corregidos
1. ✅ `.env` - Arreglado con valores válidos
2. ✅ `.env.example` - Actualizado con placeholders correctos

## Estado Final
- ✅ `npx prisma generate` - **Funciona correctamente**
- ✅ `npm run build` - **Build exitoso**
- ✅ Prisma Client generado en `./node_modules/@prisma/client`

## Notas Importantes
- El problema NO era la versión de Node.js (probado en 20.11.0, 20.18.3, 22.14.0)
- El problema NO era la versión de Prisma (probado en 5.20.0 y 6.17.0)
- El problema NO era la complejidad del schema
- **El problema era el formato incorrecto de las variables de entorno**

## Recomendación
Nunca usar autorreferencias en archivos `.env`. Si necesitas variables opcionales, usa cadenas vacías:
```env
# Correcto para variables opcionales
SENTRY_DSN=""
OPTIONAL_API_KEY=""
```
