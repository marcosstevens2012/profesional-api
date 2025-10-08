# ⚡ DEPLOY RAILWAY - 3 PASOS SIMPLES

## ✅ **PROBLEMA SOLUCIONADO**

El error de Nixpacks está arreglado. Ahora Railway funcionará correctamente.

---

## 🚀 **OPCIÓN 1: SCRIPT AUTOMÁTICO (MÁS FÁCIL)**

```bash
./railway-deploy-now.sh
```

El script hará TODO automáticamente. Solo sigue las instrucciones en pantalla.

---

## 🔧 **OPCIÓN 2: MANUAL (3 PASOS)**

### **1. Crear proyecto**
```bash
railway init
```
- Nombre: `profesional-api`
- Selecciona: `Create new project`

### **2. Configurar variables**
```bash
railway open
```
Ve a **Variables** y pega esto (actualiza JWT_SECRET y CORS_ORIGINS):

```
DATABASE_URL=postgresql://postgres:V4XFgKs2umHFNY4i@db.anqdbinmztorvdsausrn.supabase.co:5432/postgres
JWT_SECRET=cambia-esto-a-algo-super-seguro-32-caracteres
NODE_ENV=production
CORS_ORIGINS=https://tudominio.com
SUPABASE_URL=https://anqdbinmztorvdsausrn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucWRiaW5tenRvcnZkc2F1c3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDcyMjksImV4cCI6MjA3MzE4MzIyOX0.7LJecpCm2yyfVU8PyRYx-vBnCQkav4qoY00Z6-kVacM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucWRiaW5tenRvcnZkc2F1c3JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzYwNzIyOSwiZXhwIjoyMDczMTgzMjI5fQ.kvOFL7YrLp6H-MiK6HX2Pi2Mjm6UND2pVi0tP1LuR7U
STORAGE_PROVIDER=supabase
SUPABASE_STORAGE_BUCKET=attachments
ENABLE_SWAGGER=false
FRONTEND_BASE_URL=https://tudominio.com
```

### **3. Desplegar**
```bash
railway up
railway run npx prisma migrate deploy
railway domain
```

---

## ✅ **VERIFICAR**

```bash
railway logs
curl https://tu-url.up.railway.app/health
```

---

## 🔥 **LO QUE SE ARREGLÓ**

- ❌ `nixpacks.toml` removido (causaba el error)
- ✅ `railway.toml` simplificado
- ✅ Railway detecta automáticamente Node.js
- ✅ Build funcionará sin problemas

---

## 📝 **IMPORTANTE**

Antes de producción, cambia:
- `JWT_SECRET` → Algo aleatorio de 32+ caracteres
- `CORS_ORIGINS` → Tu dominio real
- `FRONTEND_BASE_URL` → URL de tu frontend

---

**¡Ejecuta `./railway-deploy-now.sh` y listo!** 🚀
