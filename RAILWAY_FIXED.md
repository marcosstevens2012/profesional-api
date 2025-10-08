# 🚀 DEPLOY EN RAILWAY - SOLUCIONADO

## ✅ **Problema Resuelto**

El error de Nixpacks ha sido corregido. Ahora Railway detectará automáticamente tu proyecto Node.js.

---

## 📋 **PASOS PARA DESPLEGAR (SIN ERRORES)**

### **1. Hacer commit de los cambios**

```bash
git add .
git commit -m "Fix Railway configuration"
```

### **2. Inicializar Railway (si no lo has hecho)**

```bash
railway init
```

- Nombre del proyecto: **profesional-api**
- Selecciona: **Create new project**

### **3. Configurar Variables de Entorno**

```bash
railway open
```

Ve a **Variables** y agrega estas (mínimo necesario):

```bash
DATABASE_URL=postgresql://postgres:V4XFgKs2umHFNY4i@db.anqdbinmztorvdsausrn.supabase.co:5432/postgres
JWT_SECRET=tu-secreto-super-seguro-de-minimo-32-caracteres
NODE_ENV=production
PORT=3001

# CORS - Cambia por tu dominio
CORS_ORIGINS=https://tudominio.com

# Supabase
SUPABASE_URL=https://anqdbinmztorvdsausrn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucWRiaW5tenRvcnZkc2F1c3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDcyMjksImV4cCI6MjA3MzE4MzIyOX0.7LJecpCm2yyfVU8PyRYx-vBnCQkav4qoY00Z6-kVacM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucWRiaW5tenRvcnZkc2F1c3JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzYwNzIyOSwiZXhwIjoyMDczMTgzMjI5fQ.kvOFL7YrLp6H-MiK6HX2Pi2Mjm6UND2pVi0tP1LuR7U

# Storage
STORAGE_PROVIDER=supabase
SUPABASE_STORAGE_BUCKET=attachments

# Otras
ENABLE_SWAGGER=false
FRONTEND_BASE_URL=https://tudominio.com
```

**Para MercadoPago (actualiza con tus claves de producción):**

```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-token-produccion
MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-clave-produccion
MERCADOPAGO_SANDBOX=false
```

### **4. Desplegar**

```bash
railway up
```

Esto:
- ✅ Instalará dependencias (`npm ci`)
- ✅ Generará Prisma Client (`prisma generate`)
- ✅ Compilará TypeScript (`nest build`)
- ✅ Iniciará el servidor (`npm run start:prod`)

### **5. Ejecutar Migraciones**

Después del primer deploy exitoso:

```bash
railway run npx prisma migrate deploy
```

### **6. Generar Dominio**

```bash
railway domain
```

Recibirás una URL como: `https://profesional-api.up.railway.app`

---

## ✅ **Verificar que Funciona**

```bash
# Ver logs en tiempo real
railway logs

# Probar el health endpoint (reemplaza con tu URL)
curl https://profesional-api.up.railway.app/health
```

Deberías ver:
```json
{"status":"ok","database":"connected",...}
```

---

## 🔧 **Cambios Realizados**

1. ✅ Simplificado `railway.toml`
2. ✅ Removido `nixpacks.toml` problemático
3. ✅ Railway ahora detecta automáticamente el proyecto Node.js
4. ✅ Agregado `.railwayignore` para optimizar deploy

---

## 🐛 **Si Todavía Hay Errores**

### Error de Build:
```bash
railway logs --build
```

### Error de Deploy:
```bash
railway logs
```

### Redesplegar:
```bash
railway up --detach
```

### Verificar Variables:
```bash
railway variables
```

---

## 📊 **Monitoring**

```bash
# Ver estado
railway status

# Ver métricas
railway open  # Ve a pestaña "Metrics"

# Ver logs históricos
railway logs --limit 100
```

---

## 🎯 **Próximos Pasos**

1. ✅ Actualizar `CORS_ORIGINS` con tu dominio real
2. ✅ Cambiar `JWT_SECRET` a algo seguro
3. ✅ Configurar claves de MercadoPago de PRODUCCIÓN
4. ✅ Configurar dominio personalizado (opcional)

---

## 💡 **Dominio Personalizado**

En el dashboard de Railway:
1. Settings → Networking
2. Add Custom Domain
3. Ingresa: `api.tudominio.com`
4. Agrega el registro CNAME en tu DNS

---

**¡Ahora deberías poder hacer deploy sin errores!** 🚀

Si sigues teniendo problemas, ejecuta:
```bash
railway logs
```

Y muéstrame el error completo.
