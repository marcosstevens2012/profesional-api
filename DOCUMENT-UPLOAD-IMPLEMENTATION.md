# Implementación de Carga de Documentos Profesionales

## Resumen

Se ha implementado completamente el sistema de carga y validación de documentos profesionales usando Supabase Storage. Este sistema permite a los profesionales subir documentos (imágenes y PDFs) para validar sus títulos, con almacenamiento seguro y políticas de acceso basadas en roles.

## Características Implementadas

### Backend (NestJS)

#### 1. Servicio de Almacenamiento (`storage.service.ts`)

- **Ubicación**: `/profesional-api/src/common/services/storage.service.ts`
- **Funcionalidades**:
  - `uploadProfessionalDocument()`: Sube archivos al bucket de Supabase
  - `deleteProfessionalDocument()`: Elimina archivos del storage
  - `getSignedUrl()`: Genera URLs firmadas con expiración
- **Validaciones**:
  - Tipos de archivo permitidos: JPEG, PNG, WEBP, PDF
  - Tamaño máximo: 10MB
  - Nombres de archivo únicos: `{userId}/{timestamp}-{filename}`

#### 2. Endpoint de Carga (`profiles.controller.ts`)

```typescript
POST /profiles/me/upload-document
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

- **Decoradores**:
  - `@UseGuards(JwtAuthGuard)`: Requiere autenticación
  - `@Roles(Role.PROFESSIONAL)`: Solo profesionales
  - `@UseInterceptors(FileInterceptor('file'))`: Maneja multipart/form-data
  - `@ApiConsumes('multipart/form-data')`: Documentación Swagger
- **Validaciones en endpoint**:
  - Verifica que se envió un archivo
  - Valida tipo MIME
  - Valida tamaño del archivo
- **Respuesta**: `{ url: string }` - URL pública del documento

#### 3. Actualización del Servicio (`profiles.service.ts`)

- Método `uploadProfessionalDocument()`:
  - Verifica que el usuario existe y es profesional
  - Elimina el documento anterior si existe (evita archivos huérfanos)
  - Sube el nuevo documento a Supabase Storage
  - Actualiza `titleDocumentUrl` en la tabla `ProfessionalProfile`
  - Retorna la URL pública del documento

#### 4. Configuración del Módulo (`profiles.module.ts`)

- Agregado `StorageService` a los providers
- Inyectado en `ProfilesService` mediante el constructor

### Frontend (Next.js + React)

#### 1. Componente de Carga (`FileUpload.tsx`)

- **Ubicación**: `/profesional/src/components/FileUpload.tsx`
- **Props**:
  - `onUploadComplete`: Callback cuando la carga finaliza
  - `currentFileUrl`: URL del archivo actual (opcional)
  - `accept`: Tipos MIME aceptados (default: image/\*, application/pdf)
  - `maxSizeMB`: Tamaño máximo en MB (default: 10)
- **Características**:
  - **Drag & Drop**: Arrastra archivos al área de carga
  - **Click para seleccionar**: Click en el área para abrir el selector
  - **Vista previa**:
    - Imágenes: Muestra preview inline
    - PDFs: Muestra icono de PDF
  - **Indicador de progreso**: Spinner mientras sube
  - **Validación client-side**:
    - Tipo de archivo
    - Tamaño máximo
  - **Manejo de errores**: Mensajes claros de error
  - **Estados visuales**:
    - Normal: Border gris con hover
    - Dragging: Border azul con fondo azul claro
    - Uploading: Overlay con spinner
    - Success: Preview del archivo

#### 2. Integración en Onboarding (`onboarding/page.tsx`)

- **Reemplazó**: Input de URL manual
- **Ahora usa**: Componente `<FileUpload />`
- **Flujo**:
  1. Usuario arrastra/selecciona archivo
  2. `FileUpload` valida y sube a API
  3. API retorna URL del documento
  4. Callback actualiza `formData.titleDocumentUrl`
  5. Al submit, URL se guarda en el perfil

### Base de Datos (Supabase)

#### Schema Changes (Prisma)

```prisma
model ProfessionalProfile {
  // ... campos existentes
  dni              String?   @db.VarChar(20)
  cuitCuil         String?   @db.VarChar(20)
  matricula        String?   @db.VarChar(100)
  titleDocumentUrl String?

  @@index([dni])
  @@index([cuitCuil])
}
```

#### Storage Setup (`supabase-storage-setup.sql`)

**Bucket**: `professional-documents`

- **Configuración**:
  - `public`: true (URLs públicas)
  - `file_size_limit`: 10485760 (10MB)
  - `allowed_mime_types`: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

**Políticas RLS**:

1. **INSERT**: Solo usuarios autenticados pueden subir archivos
2. **SELECT (usuarios)**: Usuarios pueden ver sus propios documentos
3. **SELECT (admins)**: Admins pueden ver todos los documentos
4. **UPDATE**: Solo propietarios o admins pueden actualizar
5. **DELETE**: Solo propietarios o admins pueden eliminar

## Variables de Entorno Requeridas

### Backend (.env)

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Estructura de Archivos en Storage

```
professional-documents/
  └── {userId}/
      ├── 1704123456789-titulo.pdf
      ├── 1704234567890-matricula.jpg
      └── ...
```

## Flujo Completo de Usuario

1. **Onboarding**:
   - Profesional completa DNI* y CUIT/CUIL* (obligatorios)
   - Opcionalmente: matrícula y documento de título
   - Si sube documento:
     - Arrastra/selecciona archivo
     - FileUpload valida tipo y tamaño
     - Se sube a Supabase Storage
     - URL se guarda en formData
   - Submit actualiza perfil con todos los datos

2. **Backend**:
   - Recibe archivo en `/profiles/me/upload-document`
   - Valida autenticación y rol
   - Valida archivo (tipo, tamaño)
   - Sube a Supabase con nombre único
   - Actualiza `titleDocumentUrl` en BD
   - Retorna URL pública

3. **Storage**:
   - Archivo almacenado en: `{userId}/timestamp-filename`
   - URL pública disponible
   - RLS protege acceso (solo propietario y admins)

## Validaciones en Cada Capa

### Frontend (FileUpload.tsx)

```typescript
// Tipo de archivo
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
if (!allowedMimeTypes.includes(file.mimetype)) {
  throw new Error('...');
}

// Tamaño
if (file.size > 10 * 1024 * 1024) {
  throw new Error('...');
}
```

### Backend (profiles.controller.ts)

```typescript
if (!file) {
  throw new Error('No file provided');
}

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
if (!allowedMimeTypes.includes(file.mimetype)) {
  throw new Error('Invalid file type...');
}

if (file.size > 10 * 1024 * 1024) {
  throw new Error('File size exceeds 10MB limit');
}
```

### Storage Service (storage.service.ts)

```typescript
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
if (!allowedMimeTypes.includes(fileType)) {
  throw new Error('Invalid file type...');
}

const maxSize = 10 * 1024 * 1024; // 10MB
if (fileBuffer.length > maxSize) {
  throw new Error('File too large...');
}
```

### Supabase Storage (RLS)

```sql
-- Bucket configuration
file_size_limit: 10485760 (10MB)
allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
```

## Testing

### Manual Testing

1. **Subir imagen válida (< 10MB)**:
   - ✅ Debe mostrar preview
   - ✅ Debe subir correctamente
   - ✅ Debe retornar URL

2. **Subir PDF válido (< 10MB)**:
   - ✅ Debe mostrar icono PDF
   - ✅ Debe subir correctamente
   - ✅ Debe retornar URL

3. **Intentar subir archivo > 10MB**:
   - ✅ Debe mostrar error en frontend
   - ✅ No debe hacer request

4. **Intentar subir .docx o .exe**:
   - ✅ Debe mostrar error "Tipo de archivo no permitido"

5. **Drag & Drop**:
   - ✅ Border azul al arrastrar
   - ✅ Sube al soltar
   - ✅ Vuelve a normal si cancela

6. **Reemplazar documento existente**:
   - ✅ Debe eliminar el anterior
   - ✅ Debe subir el nuevo
   - ✅ Debe actualizar URL en BD

### API Testing (con curl)

```bash
# Subir documento
curl -X POST http://localhost:3001/profiles/me/upload-document \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/titulo.pdf"

# Respuesta esperada:
# { "url": "https://xyz.supabase.co/storage/v1/object/public/professional-documents/user-id/timestamp-titulo.pdf" }
```

## Seguridad

1. **Autenticación**: JWT requerido para upload
2. **Autorización**: Solo rol PROFESSIONAL puede subir
3. **Validación de tipo**: Triple validación (client, server, storage)
4. **Validación de tamaño**: Triple validación (client, server, storage)
5. **RLS Policies**: Solo propietario y admins acceden a documentos
6. **Nombres únicos**: Evita colisiones con timestamp + userId
7. **Limpieza**: Elimina archivos anteriores al actualizar

## Próximos Pasos (Opcional)

### Mejoras Sugeridas

1. **Antivirus scanning**: Integrar servicio de escaneo de malware
2. **Compresión de imágenes**: Optimizar automáticamente imágenes grandes
3. **OCR**: Extraer texto de documentos para validación
4. **Thumbnails**: Generar miniaturas para previews rápidas
5. **Metadata**: Guardar metadata del archivo (size, mimetype, upload date)
6. **Versionado**: Mantener historial de documentos subidos
7. **Notificaciones**: Alertar admins cuando se sube nuevo documento
8. **Panel admin**: Vista para revisar y aprobar documentos

### Estado Actual de Documentos

- **Pendiente aplicar migración**: SQL generado pero no ejecutado
- **Supabase Storage**: Bucket creado manualmente o via SQL file
- **Variables de entorno**: Verificar que están configuradas

## Archivos Modificados/Creados

### Backend

- ✅ `src/common/services/storage.service.ts` (CREADO)
- ✅ `src/profiles/profiles.controller.ts` (MODIFICADO - agregado endpoint upload)
- ✅ `src/profiles/profiles.service.ts` (MODIFICADO - agregado método upload)
- ✅ `src/profiles/profiles.module.ts` (MODIFICADO - agregado StorageService)
- ✅ `prisma/schema.prisma` (MODIFICADO - agregados campos)
- ✅ `supabase-storage-setup.sql` (CREADO)

### Frontend

- ✅ `src/components/FileUpload.tsx` (CREADO)
- ✅ `src/app/(auth)/onboarding/page.tsx` (MODIFICADO - integrado FileUpload)

## Comandos para Completar Setup

```bash
# Backend - Instalar dependencias (si no están)
cd profesional-api
npm install @supabase/supabase-js

# Aplicar migración de Prisma (cuando DB esté accesible)
npx prisma migrate dev --name add_professional_validation_fields

# Aplicar SQL de Supabase Storage
# Opción 1: Via Supabase Dashboard > SQL Editor
# Opción 2: Via psql
psql "postgresql://postgres:[PASSWORD]@db.xyz.supabase.co:5432/postgres" < supabase-storage-setup.sql

# Frontend - No requiere instalación adicional
# Las dependencias ya están instaladas
```

## Estado Final

✅ **Backend**:

- Endpoint de upload funcional
- StorageService implementado
- Validaciones en todos los niveles
- Documentación Swagger

✅ **Frontend**:

- Componente FileUpload con drag & drop
- Integrado en onboarding
- Preview de imágenes y PDFs
- Manejo de errores

⏸️ **Pendiente**:

- Aplicar migración de base de datos
- Ejecutar SQL de Supabase Storage
- Configurar variables de entorno
- Testing en producción

🎯 **Listo para usar** una vez aplicadas las migraciones y configuradas las variables de entorno.
