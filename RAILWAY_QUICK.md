# ⚡ DEPLOY RAILWAY - 5 COMANDOS

## 🎯 LO QUE NECESITAS HACER:

### 1️⃣ Crear proyecto (te pedirá nombre)
```bash
railway init
```
- Nombre: **profesional-api**
- Selecciona: **Create new project**

### 2️⃣ Abrir dashboard para configurar variables
```bash
railway open
```
- Ve a pestaña **Variables**
- Copia TODO el contenido de `.env.railway`
- **IMPORTANTE:** Cambia estos valores:
  - `JWT_SECRET` → Un texto aleatorio de 32+ caracteres
  - `CORS_ORIGINS` → Tu dominio real
  - `MERCADOPAGO_ACCESS_TOKEN` → Token de PRODUCCIÓN
  - `MERCADOPAGO_PUBLIC_KEY` → Clave de PRODUCCIÓN
  - `MERCADOPAGO_SANDBOX` → Cambiar a `false`
  - `FRONTEND_BASE_URL` → URL de tu frontend

### 3️⃣ Desplegar
```bash
railway up
```
Espera que termine (2-3 minutos)

### 4️⃣ Ejecutar migraciones de base de datos
```bash
railway run npx prisma migrate deploy
```

### 5️⃣ Generar URL pública
```bash
railway domain
```

## ✅ VERIFICAR QUE FUNCIONA

```bash
# Ver logs
railway logs

# Probar el endpoint de health
curl https://tu-url.up.railway.app/health
```

## 🎉 ¡LISTO!

Tu API está funcionando en Railway.

**URL:** La que generó `railway domain`

---

## 📱 OPCIONAL: Agregar PostgreSQL de Railway

Si NO quieres usar Supabase:

```bash
railway add
```
Selecciona: **PostgreSQL**

Railway configurará automáticamente `DATABASE_URL`.

---

## 🔧 COMANDOS ÚTILES

```bash
railway logs          # Ver logs en tiempo real
railway open          # Abrir dashboard
railway status        # Ver estado del proyecto
railway domain        # Ver/generar dominio
```

---

## ⚠️ SI ALGO FALLA

```bash
# Ver qué pasó
railway logs

# Reconstruir y redesplegar
railway up --detach
```

---

**Archivo con variables:** `.env.railway`  
**Guía completa:** `RAILWAY_DEPLOY.md`
