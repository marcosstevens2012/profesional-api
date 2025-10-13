# 🚂 Railway Deployment Guide

## 📋 Problema de Migraciones en Railway

**Error:** `ERROR: prepared statement "s0" already exists`

Este error ocurre porque Supabase usa connection pooling (PgBouncer) que no es compatible con `prisma migrate deploy` durante el build.

## ✅ Solución

### Opción 1: Usar URL de Conexión Directa (RECOMENDADO)

1. En Supabase, ve a **Settings > Database**
2. Copia la **Connection String** en modo **Session** (no Transaction)
3. En Railway, agrega una variable de entorno:
   ```
   DATABASE_URL_DIRECT=postgresql://postgres.[project-ref]:[password]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
   ```
4. Modifica `package.json`:
   ```json
   {
     "scripts": {
       "build": "prisma generate && nest build",
       "migrate": "prisma migrate deploy"
     }
   }
   ```
5. En Railway, agrega un **Build Command**:
   ```bash
   npm run migrate && npm run build
   ```

### Opción 2: Ejecutar Migraciones Manualmente

Si la opción 1 no funciona, ejecuta las migraciones desde tu máquina local:

```bash
# Usando la DATABASE_URL de producción
DATABASE_URL="tu-url-de-produccion" npx prisma migrate deploy
```

Luego haz deploy normalmente en Railway.

### Opción 3: Script Automático (Actual)

He creado `railway-migrate.sh` que intenta usar `DATABASE_URL_DIRECT` y si falla, continúa sin romper el build.

Para usarlo en Railway:
1. Ve a **Settings > Build**
2. En **Build Command** pon:
   ```bash
   ./railway-migrate.sh && npm run build
   ```

## 🔍 Verificar Estado de Migraciones

Para ver qué migraciones están aplicadas:

```bash
DATABASE_URL="tu-url" npx prisma migrate status
```

## 📝 Migraciones Pendientes

Si hay migraciones pendientes después del deploy:

```bash
# Conectarte a la DB de producción
DATABASE_URL="tu-url" npx prisma migrate deploy
```

## ⚠️ Importante

- **NO** incluyas `prisma migrate deploy` en el script `build` cuando uses connection pooling
- **SÍ** usa una conexión directa (sin pooling) para migraciones
- Las migraciones deben ejecutarse ANTES del build, no durante

## 🎯 Estado Actual

- ✅ `package.json` configurado sin migraciones en build
- ✅ `railway-migrate.sh` creado para opción 3
- ✅ `railway.json` configurado con comandos correctos
- ⚠️ Necesitas configurar `DATABASE_URL_DIRECT` en Railway

## 🚀 Próximos Pasos

1. Configura `DATABASE_URL_DIRECT` en Railway
2. O ejecuta migraciones manualmente una vez
3. Haz push del código actualizado
4. Railway hará deploy sin errores
