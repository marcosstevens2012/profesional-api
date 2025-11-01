# Guía de Setup - Sistema de Carga de Documentos Profesionales

## Requisitos Previos

- ✅ Cuenta de Supabase activa
- ✅ Proyecto Supabase configurado
- ✅ Base de datos PostgreSQL accesible
- ✅ Credenciales de Supabase (URL y Service Role Key)

## Paso 1: Configurar Variables de Entorno

### Backend (`profesional-api/.env`)

Agrega estas variables a tu archivo `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Otras variables existentes...
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

**¿Dónde encontrar estas credenciales?**

1. Ve a tu proyecto en Supabase Dashboard
2. Sidebar → Project Settings → API
3. **URL del Proyecto**: Copia "Project URL"
4. **Service Role Key**: Copia "service_role" key (bajo "Project API keys")

⚠️ **IMPORTANTE**:

- Usa `service_role` key, NO la `anon` key
- NUNCA expongas el `service_role` key en el frontend
- Agrega `.env` a `.gitignore`

### Frontend (`profesional/.env.local`)

Verifica que tienes:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# o la URL de tu API en producción
```

## Paso 2: Aplicar Migraciones de Base de Datos

### Opción A: Via Supabase Dashboard (Recomendado)

1. Abre [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Sidebar → SQL Editor
4. Click en "New query"
5. Copia y pega el contenido de `add-professional-validation-fields.sql`
6. Click en "Run"
7. Verifica que aparece "Success. No rows returned"

### Opción B: Via Prisma CLI

```bash
cd profesional-api

# Genera la migración
npx prisma migrate dev --name add_professional_validation_fields

# Aplica la migración
npx prisma migrate deploy
```

### Opción C: Via psql

```bash
# Reemplaza [PASSWORD], [HOST], [PORT] con tus credenciales
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" \
  -f add-professional-validation-fields.sql
```

## Paso 3: Configurar Supabase Storage

### Opción A: Via Supabase Dashboard (Recomendado)

1. Abre [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Sidebar → SQL Editor
4. Click en "New query"
5. Copia y pega el contenido de `supabase-storage-setup.sql`
6. Click en "Run"
7. Verifica que aparece "Success"

### Opción B: Via psql

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" \
  -f supabase-storage-setup.sql
```

### Verificación

1. Sidebar → Storage
2. Deberías ver el bucket "professional-documents"
3. Click en el bucket
4. Verifica que está marcado como "Public"
5. Click en "Policies" → deberías ver 5 políticas creadas

## Paso 4: Instalar Dependencias (si no están)

### Backend

```bash
cd profesional-api

# Verificar si @supabase/supabase-js está instalado
npm list @supabase/supabase-js

# Si NO está instalado:
npm install @supabase/supabase-js
```

### Frontend

```bash
cd profesional

# Todas las dependencias necesarias ya deberían estar instaladas
# Pero si necesitas verificar:
npm install
```

## Paso 5: Verificar la Implementación

### Test 1: Backend - Verificar StorageService

```bash
cd profesional-api

# Iniciar el servidor
npm run start:dev

# En otra terminal, verificar que el servicio está funcionando:
curl http://localhost:3001/health
```

### Test 2: Frontend - Verificar Componente

```bash
cd profesional

# Iniciar el servidor de desarrollo
npm run dev

# Abrir en navegador:
# http://localhost:3000/onboarding
```

### Test 3: Upload End-to-End

1. **Crear un usuario profesional** (si no existe):

   ```bash
   # Registrarse en la aplicación
   # O usar el script de crear profesional
   ```

2. **Completar onboarding**:
   - Ir a `/onboarding`
   - Completar DNI y CUIT/CUIL
   - Arrastra una imagen o PDF al área de carga
   - Verificar que aparece el preview
   - Click en "Completar perfil"
   - Verificar redirección a `/panel`

3. **Verificar en Supabase**:
   - Dashboard → Storage → professional-documents
   - Deberías ver tu archivo en: `{userId}/timestamp-filename.ext`
   - Dashboard → Table Editor → ProfessionalProfile
   - Verificar que `titleDocumentUrl` contiene la URL del archivo

## Paso 6: Testing de API

### Test con curl

```bash
# Primero, obtener un token de autenticación
# (registrarse/login en la app y copiar el token del localStorage)

# Test de upload
curl -X POST http://localhost:3001/profiles/me/upload-document \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -F "file=@/ruta/a/tu/archivo.pdf"

# Respuesta esperada:
# {
#   "url": "https://xyz.supabase.co/storage/v1/object/public/professional-documents/user-id/timestamp-archivo.pdf"
# }
```

### Test con Postman

1. **Crear request**:
   - Method: `POST`
   - URL: `http://localhost:3001/profiles/me/upload-document`

2. **Headers**:
   - `Authorization`: `Bearer TU_TOKEN_AQUI`

3. **Body**:
   - Type: `form-data`
   - Key: `file`
   - Type: `File`
   - Value: Seleccionar archivo

4. **Send** → Verificar response con URL

## Paso 7: Deployment

### Backend (Railway/Heroku/etc)

1. **Agregar variables de entorno**:

   ```
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   ```

2. **Aplicar migraciones**:

   ```bash
   # Si usas Railway:
   railway run npx prisma migrate deploy

   # Si usas Heroku:
   heroku run npx prisma migrate deploy
   ```

### Frontend (Vercel/Netlify/etc)

1. **Agregar variable de entorno**:

   ```
   NEXT_PUBLIC_API_URL=https://tu-api.railway.app
   ```

2. **Deploy**:

   ```bash
   # Vercel
   vercel --prod

   # Netlify
   netlify deploy --prod
   ```

## Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"

**Solución**:

```bash
cd profesional-api
npm install @supabase/supabase-js
```

### Error: "Bucket not found: professional-documents"

**Solución**:

- Verifica que ejecutaste `supabase-storage-setup.sql`
- Ve a Supabase Dashboard → Storage
- Si no existe el bucket, ejecuta el SQL nuevamente

### Error: "Invalid file type"

**Solución**:

- Verifica que el archivo es JPEG, PNG, WEBP o PDF
- Verifica que el mime type es correcto
- Si es PDF, verifica que no esté corrupto

### Error: "File size exceeds 10MB limit"

**Solución**:

- Comprime la imagen/PDF antes de subir
- O aumenta el límite en:
  - `storage.service.ts` (línea con maxSize)
  - `FileUpload.tsx` (prop maxSizeMB)
  - `supabase-storage-setup.sql` (file_size_limit en bucket config)

### Error: "Row Level Security policy violation"

**Solución**:

- Verifica que las políticas RLS fueron creadas
- Ejecuta `supabase-storage-setup.sql` nuevamente
- Verifica que el usuario está autenticado

### Error: "CORS policy"

**Solución**:

- Verifica CORS en NestJS:
  ```typescript
  // main.ts
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });
  ```

## Verificación Final - Checklist

Antes de marcar como completo, verifica:

- [ ] Variables de entorno configuradas (backend y frontend)
- [ ] Migración de BD aplicada (campos dni, cuitCuil, etc existen)
- [ ] Bucket de Supabase creado (professional-documents existe)
- [ ] Políticas RLS creadas (5 políticas visibles en dashboard)
- [ ] Dependencia @supabase/supabase-js instalada
- [ ] Backend compila sin errores
- [ ] Frontend compila sin errores
- [ ] Test de upload funciona (archivo se sube a Supabase)
- [ ] Test de preview funciona (imagen/PDF se muestra)
- [ ] URL se guarda en BD (titleDocumentUrl tiene valor)
- [ ] Solo profesionales pueden subir (test con usuario CLIENT falla)
- [ ] Solo propietario ve su documento (test con otro usuario falla)

## Comandos de Referencia Rápida

```bash
# Backend
cd profesional-api
npm install @supabase/supabase-js
npx prisma migrate dev
npm run start:dev

# Frontend
cd profesional
npm run dev

# Database
psql "postgresql://..." -f add-professional-validation-fields.sql
psql "postgresql://..." -f supabase-storage-setup.sql

# Testing
curl -X POST http://localhost:3001/profiles/me/upload-document \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@archivo.pdf"
```

## Soporte

Si encuentras problemas:

1. **Revisa los logs**:
   - Backend: Terminal donde corre `npm run start:dev`
   - Frontend: Console del navegador (F12)

2. **Verifica configuración**:
   - `.env` tiene las credenciales correctas
   - Supabase Dashboard muestra el bucket
   - Base de datos tiene las columnas nuevas

3. **Consulta la documentación**:
   - `DOCUMENT-UPLOAD-IMPLEMENTATION.md`: Explicación técnica completa
   - Supabase Docs: https://supabase.com/docs/guides/storage

---

✅ **Una vez completados estos pasos, el sistema de carga de documentos estará completamente funcional.**
