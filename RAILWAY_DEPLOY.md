# 🚀 DESPLEGAR EN RAILWAY - GUÍA RÁPIDA

## ✅ Paso 1: Login en Railway

Abre tu terminal y ejecuta:

```bash
railway login
```

Se abrirá tu navegador para que autorices la aplicación.

## ✅ Paso 2: Crear Proyecto en Railway

```bash
railway init
```

Te preguntará:
- **"What would you like to name your project?"** → Escribe: `profesional-api`
- **"Create a new project or link to an existing one?"** → Selecciona: `Create new project`

## ✅ Paso 3: (Opcional) Agregar PostgreSQL

Si NO quieres usar Supabase y prefieres la base de datos de Railway:

```bash
railway add
```

Selecciona: **PostgreSQL**

Railway configurará automáticamente la variable `DATABASE_URL`.

**Si usas Supabase:** Sáltate este paso, usaremos las variables del archivo `.env.railway`.

## ✅ Paso 4: Configurar Variables de Entorno

### Opción A: Desde el Dashboard (Recomendado)

1. Ejecuta: `railway open`
2. Ve a la pestaña **Variables**
3. Copia y pega las variables del archivo `.env.railway`
4. **IMPORTANTE:** Actualiza estos valores:
   - `JWT_SECRET` → Tu secreto seguro
   - `CORS_ORIGINS` → Tu dominio de producción
   - `FRONTEND_BASE_URL` → Tu dominio de frontend
   - `MERCADOPAGO_ACCESS_TOKEN` → Token de producción
   - `MERCADOPAGO_PUBLIC_KEY` → Clave pública de producción

### Opción B: Desde la Terminal

```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="tu-secreto-super-seguro"
railway variables set CORS_ORIGINS="https://tudominio.com"
railway variables set NODE_ENV="production"
# ... continúa con todas las variables
```

## ✅ Paso 5: Desplegar

```bash
railway up
```

Esto:
1. Subirá tu código
2. Instalará dependencias
3. Ejecutará `prisma generate`
4. Compilará con `npm run build`
5. Iniciará con `npm run start:prod`

## ✅ Paso 6: Ejecutar Migraciones

Después del primer deploy:

```bash
railway run npm run prisma:migrate
```

O si prefieres:

```bash
railway run npx prisma migrate deploy
```

## ✅ Paso 7: Obtener URL

```bash
railway domain
```

Esto genera una URL pública como: `https://profesional-api.up.railway.app`

## ✅ Paso 8: Verificar

Prueba tu API:

```bash
curl https://profesional-api.up.railway.app/health
```

Deberías ver: `{"status":"ok",...}`

## 🎯 COMANDOS ÚTILES

```bash
# Ver logs en tiempo real
railway logs

# Abrir dashboard
railway open

# Ver estado
railway status

# Ejecutar comando en Railway
railway run <comando>

# Agregar dominio personalizado
railway domain add tudominio.com

# Ver variables
railway variables

# Eliminar variable
railway variables delete NOMBRE_VARIABLE
```

## 🔧 CONFIGURAR DOMINIO PERSONALIZADO

1. En el dashboard de Railway:
   - Settings → Domains
   - Add Domain
   - Ingresa: `api.tudominio.com`

2. En tu proveedor de DNS (GoDaddy, Cloudflare, etc.):
   - Agrega un registro CNAME:
     - Nombre: `api`
     - Valor: `profesional-api.up.railway.app`

## ⚠️ VARIABLES CRÍTICAS QUE DEBES CAMBIAR

Antes de usar en producción, ACTUALIZA:

1. **JWT_SECRET** → Genera uno seguro (mínimo 32 caracteres)
2. **MERCADOPAGO_ACCESS_TOKEN** → Usa token de PRODUCCIÓN (no TEST)
3. **MERCADOPAGO_PUBLIC_KEY** → Usa clave de PRODUCCIÓN (no TEST)
4. **MERCADOPAGO_SANDBOX** → Cambiar a `false`
5. **CORS_ORIGINS** → Tu dominio real de producción
6. **FRONTEND_BASE_URL** → URL de tu frontend en producción
7. **ENABLE_SWAGGER** → Debe ser `false` en producción

## 📊 MONITOREO

Railway ofrece:
- ✅ Métricas automáticas (CPU, RAM, Red)
- ✅ Logs en tiempo real
- ✅ Health checks automáticos
- ✅ Reinicio automático si falla

Ver en: `railway open` → Pestaña "Metrics"

## 🐛 TROUBLESHOOTING

### Error: "Build failed"
```bash
# Ver logs detallados
railway logs --build

# Verificar que compile localmente
npm run build
```

### Error: "Cannot connect to database"
```bash
# Verificar que DATABASE_URL está configurada
railway variables

# Si usas Railway PostgreSQL, asegúrate de haberla agregado
railway add postgresql
```

### Error: "Port already in use"
Railway asigna el puerto automáticamente. Asegúrate que `main.ts` use:
```typescript
const port = process.env.PORT || 3001;
```

### Deploy exitoso pero no responde
```bash
# Ver logs en tiempo real
railway logs --follow

# Verificar health check
railway run curl http://localhost:3001/health
```

## 🎉 LISTO!

Tu API está desplegada en Railway. Características:

- ✅ Sin cold starts
- ✅ WebSockets funcionan
- ✅ Sin límite de tiempo de ejecución
- ✅ Reinicio automático
- ✅ HTTPS automático
- ✅ Métricas incluidas
- ✅ ~$10-15/mes todo incluido

## 📱 PRÓXIMOS PASOS

1. Configura tu dominio personalizado
2. Actualiza variables de producción (MercadoPago, JWT)
3. Conecta tu frontend a la nueva URL
4. Configura Sentry para monitoreo de errores (opcional)
5. Habilita backups automáticos en Railway

---

**¿Necesitas ayuda?** Ejecuta `railway logs` para ver errores en tiempo real.
