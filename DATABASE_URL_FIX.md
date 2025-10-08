# 🔧 URL CORRECTA PARA RAILWAY

## ❌ URL ACTUAL (NO FUNCIONA EN RAILWAY):
```
postgresql://postgres:V4XFgKs2umHFNY4i@db.anqdbinmztorvdsausrn.supabase.co:5432/postgres
```

## ✅ URL CORRECTA (USA POOLER):
```
postgresql://postgres:V4XFgKs2umHFNY4i@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

O si tu región es diferente, usa el formato:
```
postgresql://postgres:V4XFgKs2umHFNY4i@aws-0-[TU-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## 📝 **CÓMO OBTENER LA URL CORRECTA DE SUPABASE:**

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/anqdbinmztorvdsausrn
2. Ve a **Settings** → **Database**
3. En **Connection String**, selecciona **"Transaction"** o **"Session"** (NO "Direct connection")
4. Copia la URI que aparece (debe tener puerto **6543** y terminar en `?pgbouncer=true`)
5. Reemplaza `[YOUR-PASSWORD]` con tu password real

---

## 🚀 **ACTUALIZAR EN RAILWAY:**

```bash
railway open
```

1. Ve a **Variables**
2. Busca **DATABASE_URL**
3. Reemplaza con la URL del pooler (puerto 6543)
4. Save

Railway redespleará automáticamente.

---

## 🔍 **DIFERENCIAS:**

```
❌ DIRECTO:  db.anqdbinmztorvdsausrn.supabase.co:5432
✅ POOLER:   aws-0-[region].pooler.supabase.com:6543
```

El pooler es necesario para:
- ✅ Serverless functions (Vercel, Netlify)
- ✅ Contenedores (Railway, Render)
- ✅ Múltiples conexiones simultáneas
