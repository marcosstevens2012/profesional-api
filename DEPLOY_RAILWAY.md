# ✅ Solución Completa: Deployment en Railway

## 🎯 Problema Resuelto

**Error original:** `ERROR: prepared statement "s0" already exists`

**Causa:** Supabase usa connection pooling (PgBouncer) que no es compatible con `prisma migrate deploy` durante el build de Railway.

**Solución:** Separar las migraciones del build y ejecutarlas con conexión directa.

---

## 🚀 Pasos para Deployar en Railway

### Paso 1: Configurar Variable de Entorno (IMPORTANTE)

En Railway, ve a tu proyecto → **Variables** y agrega:

```
DATABASE_URL_DIRECT=postgresql://postgres.tuproyecto:[tu-password]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**¿Dónde conseguir esta URL?**
1. Ve a Supabase → **Settings** → **Database**
2. En **Connection String**, selecciona **Session mode** (NO Transaction mode)
3. Copia la URL completa
4. Pégala en Railway como `DATABASE_URL_DIRECT`

### Paso 2: Configurar Build Command en Railway

En Railway → **Settings** → **Deploy** → **Build Command**:

```bash
chmod +x railway-migrate.sh && ./railway-migrate.sh && npm run build
```

O si prefieres más simple:

```bash
npm run build
```

(Y ejecuta las migraciones manualmente una vez, ver Paso 3)

### Paso 3: Ejecutar Migraciones Manualmente (UNA VEZ)

Desde tu máquina local:

```bash
# Obtén la DATABASE_URL de Railway o Supabase (modo Session)
DATABASE_URL="postgresql://tu-url-aqui" npx prisma migrate deploy
```

Esto aplicará todas las migraciones pendientes a la base de datos de producción.

---

## 📋 Verificación

### 1. Verificar que el código está pusheado:
```bash
git log --oneline -5
```

Deberías ver:
- `a9fed32` - fix: remove prisma migrate deploy from build
- `0c4c2fb` - chore: format all source files with prettier
- `1ee88e8` - chore: add prisma migrate deploy to build script
- `9b0ca2e` - fix: make PaymentEvent.paymentId optional
- `b9c0dd9` - fix: convert externalId to string

### 2. Verificar estado de migraciones:
```bash
DATABASE_URL="tu-url-de-produccion" npx prisma migrate status
```

### 3. Verificar que Railway puede hacer build:
- Ve a Railway Dashboard
- Mira los logs del último deploy
- Debe decir: "✔ Generated Prisma Client" y "Build completed successfully"

---

## 🎉 Resultado Final

Después de seguir estos pasos:

✅ Railway podrá hacer build sin errores  
✅ Las migraciones estarán aplicadas en la DB  
✅ Los webhooks de MercadoPago funcionarán correctamente  
✅ No más errores de "prepared statement already exists"

---

## 🔍 Comandos Útiles

### Ver logs de Railway:
```bash
railway logs
```

### Verificar migraciones localmente:
```bash
npx prisma migrate status
```

### Aplicar migraciones en producción:
```bash
DATABASE_URL="url-produccion" npx prisma migrate deploy
```

### Ver base de datos en Prisma Studio:
```bash
DATABASE_URL="url-produccion" npx prisma studio
```

---

## 📝 Archivos Modificados

1. ✅ `package.json` - Removido `prisma migrate deploy` del script build
2. ✅ `railway-migrate.sh` - Script para ejecutar migraciones en Railway
3. ✅ `railway.json` - Configuración de Railway
4. ✅ `RAILWAY_MIGRATIONS.md` - Guía detallada de migraciones
5. ✅ Este archivo - Quick start guide

---

## ⚠️ Importante

- **NO** ejecutes `prisma migrate deploy` en el build si usas connection pooling
- **SÍ** usa `DATABASE_URL_DIRECT` (conexión Session mode) para migraciones
- Las migraciones solo necesitan ejecutarse cuando cambias el schema
- Una vez aplicadas, no es necesario volver a ejecutarlas

---

## 🆘 Si Algo Sale Mal

1. **Build falla en Railway:**
   - Verifica que `npm run build` funcione localmente
   - Verifica que no haya errores de TypeScript
   - Chequea los logs de Railway

2. **Migraciones no se aplican:**
   - Ejecuta manualmente: `DATABASE_URL="..." npx prisma migrate deploy`
   - Verifica que la URL sea correcta (modo Session, no Transaction)

3. **Webhooks siguen fallando:**
   - Verifica que la migración `20251013205354_make_payment_event_payment_id_optional` esté aplicada
   - Chequea los logs del webhook en Railway
   - Verifica que el código esté actualizado

---

**Fecha:** 13 de Octubre, 2025  
**Status:** ✅ LISTO PARA DEPLOY  
**Próximo paso:** Configurar `DATABASE_URL_DIRECT` en Railway y hacer redeploy
