# Campos Editables de Perfil - Cliente y Profesional

## Resumen

Se han agregado campos completos y personalizados tanto para clientes (Profile) como para profesionales (ProfessionalProfile), permitiendo que ambos tipos de usuarios puedan editar información detallada de sus perfiles.

---

## CAMPOS PARA CLIENTES (Profile)

Los clientes tienen acceso a los siguientes campos editables a través del endpoint `PATCH /profiles/me`:

### Información Personal Básica

- ✅ `firstName` - Nombre (string, máx 100 caracteres) - REQUERIDO
- ✅ `lastName` - Apellido (string, máx 100 caracteres) - REQUERIDO
- ✅ `avatar` - URL de imagen de perfil (string URL, opcional)
- ✅ `phone` - Número de teléfono (string, máx 50 caracteres, opcional)
- ✅ `bio` - Biografía personal (string, máx 1000 caracteres, opcional)

### Información Demográfica

- ✅ `dateOfBirth` - Fecha de nacimiento (ISO 8601 date, opcional)
- ✅ `gender` - Género (string, máx 50 caracteres, opcional)

### Ubicación

- ✅ `address` - Dirección (string, máx 255 caracteres, opcional)
- ✅ `city` - Ciudad (string, máx 100 caracteres, opcional)
- ✅ `province` - Provincia (string, máx 100 caracteres, opcional)
- ✅ `postalCode` - Código postal (string, máx 20 caracteres, opcional)
- ✅ `country` - País (string, máx 100 caracteres, default: "Argentina", opcional)

### Contacto de Emergencia

- ✅ `emergencyContactName` - Nombre del contacto (string, máx 200 caracteres, opcional)
- ✅ `emergencyContactPhone` - Teléfono del contacto (string, máx 50 caracteres, opcional)

### Preferencias

- ✅ `preferences` - Preferencias del cliente en formato JSON (JSONB, flexible, opcional)

---

## CAMPOS PARA PROFESIONALES (ProfessionalProfile)

Los profesionales tienen acceso a TODOS los campos de clientes MÁS los siguientes campos específicos:

### Información Profesional Básica

- ✅ `email` - Email profesional (string email, máx 255 caracteres, opcional)
- ✅ `name` - Nombre profesional/comercial (string, máx 255 caracteres, opcional)
- ✅ `bio` - Biografía corta (string, máx 500 caracteres, opcional)
- ✅ `description` - Descripción larga del servicio (string, máx 2000 caracteres, opcional)
- ✅ `avatar` - Avatar profesional (string URL, opcional)
- ✅ `phone` - Teléfono profesional (string, máx 50 caracteres, opcional)

### Configuración de Servicio

- ✅ `pricePerSession` - Precio por sesión (decimal, 2 decimales, opcional)
- ✅ `standardDuration` - Duración estándar en minutos (int, min 15, default 60, opcional)
- ✅ `serviceCategoryId` - ID de categoría de servicio (string UUID, opcional)
- ✅ `tags` - Etiquetas/keywords (array de strings, opcional)
- ✅ `locationId` - ID de ubicación (string UUID, opcional)
- ✅ `isActive` - Estado activo/inactivo (boolean, opcional)

### Redes Sociales y Web

- ✅ `website` - Sitio web profesional (string URL, opcional)
- ✅ `linkedIn` - Perfil de LinkedIn (string URL, opcional)
- ✅ `instagram` - Perfil de Instagram (string URL, opcional)
- ✅ `facebook` - Perfil de Facebook (string URL, opcional)
- ✅ `twitter` - Perfil de Twitter/X (string URL, opcional)

### Educación y Experiencia

- ✅ `education` - Formación académica (string, máx 1000 caracteres, opcional)
- ✅ `experience` - Experiencia profesional (string, máx 2000 caracteres, opcional)
- ✅ `specialties` - Especialidades (array de strings, opcional)
- ✅ `languages` - Idiomas que habla (array de strings, opcional)
- ✅ `yearsOfExperience` - Años de experiencia (int, min 0, opcional)

### Documentación y Validación

- ✅ `dni` - DNI (string, máx 20 caracteres, OBLIGATORIO para onboarding, opcional después)
- ✅ `cuitCuil` - CUIT/CUIL (string, máx 20 caracteres, OBLIGATORIO para onboarding, opcional después)
- ✅ `matricula` - Número de matrícula profesional (string, máx 100 caracteres, opcional)
- ✅ `titleDocumentUrl` - URL del documento del título (string URL, opcional - subido via endpoint de upload)

---

## Endpoint de Actualización

### Para TODOS los usuarios (Cliente y Profesional)

```http
PATCH /profiles/me
Authorization: Bearer {token}
Content-Type: application/json

{
  // Cualquiera de los campos listados arriba según el tipo de usuario
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "+5491123456789",
  "bio": "Desarrollador full stack...",
  // ... más campos
}
```

### Lógica del Backend

El backend detecta automáticamente el tipo de usuario (`CLIENT` o `PROFESSIONAL`) y:

1. **Para CLIENTES**: Actualiza solo la tabla `Profile` con los campos permitidos
2. **Para PROFESIONALES**:
   - Actualiza la tabla `Profile` con campos comunes (firstName, lastName, etc.)
   - Actualiza la tabla `ProfessionalProfile` con campos específicos (bio, description, tags, etc.)

---

## Ejemplos de Uso

### Cliente actualizando su perfil

```json
{
  "firstName": "María",
  "lastName": "González",
  "phone": "+5491145678901",
  "dateOfBirth": "1990-05-15",
  "city": "Buenos Aires",
  "province": "CABA",
  "emergencyContactName": "Pedro González",
  "emergencyContactPhone": "+5491156789012"
}
```

### Profesional actualizando su perfil

```json
{
  "firstName": "Dr. Carlos",
  "lastName": "Rodríguez",
  "name": "Dr. Carlos Rodríguez - Psicólogo Clínico",
  "bio": "Especialista en terapia cognitivo-conductual",
  "description": "Con más de 10 años de experiencia ayudando a pacientes...",
  "phone": "+5491167890123",
  "pricePerSession": 8000,
  "standardDuration": 50,
  "education": "Lic. en Psicología - UBA, Posgrado en TCC - UCES",
  "experience": "10 años de práctica clínica, ex-supervisor en Hospital...",
  "specialties": ["Ansiedad", "Depresión", "Terapia de Pareja"],
  "languages": ["Español", "Inglés"],
  "yearsOfExperience": 10,
  "website": "https://drcarlosrodriguez.com.ar",
  "linkedIn": "https://linkedin.com/in/drcarlosrodriguez",
  "dni": "12345678",
  "cuitCuil": "20-12345678-9",
  "matricula": "MP-54321"
}
```

---

## Migraciones de Base de Datos

### Archivo SQL: `add-client-and-professional-fields.sql`

Este archivo contiene las migraciones SQL para agregar todos los campos nuevos a las tablas `profiles` y `professional_profiles`.

**Ejecutar con:**

```bash
# Opción 1: Supabase Dashboard
# SQL Editor → Nueva Query → Pegar contenido → Run

# Opción 2: psql
psql "tu-connection-string" -f add-client-and-professional-fields.sql

# Opción 3: Prisma (recomendado)
cd profesional-api
npx prisma migrate dev --name add_all_profile_fields
```

---

## Validaciones

### Backend (NestJS + class-validator)

Todas las validaciones están en `UpdateProfileDto`:

- ✅ Límites de longitud de strings
- ✅ Validación de URLs para campos de tipo URL
- ✅ Validación de email para campos de tipo email
- ✅ Validación de números enteros/decimales
- ✅ Validación de arrays

### Frontend (Zod schemas)

Los schemas de Zod en `schemas.ts` validan:

- ✅ Tipos de datos correctos
- ✅ Formatos de URL, email, fechas
- ✅ Longitudes máximas/mínimas
- ✅ Valores por defecto

---

## Campos de Solo Lectura

Los siguientes campos NO se pueden editar vía API (son gestionados por el sistema):

### Profile

- `id` - ID del perfil
- `userId` - ID del usuario
- `createdAt` - Fecha de creación
- `updatedAt` - Fecha de actualización (auto)
- `deletedAt` - Fecha de eliminación (soft delete)

### ProfessionalProfile

- `id` - ID del perfil profesional
- `userId` - ID del usuario
- `rating` - Calificación promedio (calculada automáticamente)
- `reviewCount` - Cantidad de reseñas (calculada automáticamente)
- `isVerified` - Estado de verificación (solo admins)
- `mercadoPagoUserId` - User ID de MercadoPago (configurado via endpoint específico)
- `mpConfiguredAt` - Fecha de configuración de MP (auto)
- `createdAt` - Fecha de creación
- `updatedAt` - Fecha de actualización (auto)
- `deletedAt` - Fecha de eliminación (soft delete)

---

## Índices Creados

Para optimizar las búsquedas:

### Profile

- `profiles_city_idx` - Índice en `city`
- `profiles_province_idx` - Índice en `province`

### ProfessionalProfile

- Índices existentes en: `email`, `serviceCategoryId`, `locationId`, `dni`, `cuitCuil`

---

## Testing

### Test de actualización (Cliente)

```bash
curl -X PATCH http://localhost:3001/profiles/me \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ana",
    "lastName": "Martínez",
    "city": "Córdoba",
    "province": "Córdoba",
    "phone": "+5493515123456"
  }'
```

### Test de actualización (Profesional)

```bash
curl -X PATCH http://localhost:3001/profiles/me \
  -H "Authorization: Bearer PROFESSIONAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lic. Ana Martínez - Nutricionista",
    "bio": "Nutricionista especializada en deportes",
    "pricePerSession": 6500,
    "specialties": ["Nutrición Deportiva", "Pérdida de peso"],
    "languages": ["Español", "Inglés", "Italiano"],
    "yearsOfExperience": 5
  }'
```

---

## Próximos Pasos

1. ✅ Aplicar migración SQL
2. ✅ Actualizar frontend para mostrar/editar nuevos campos
3. ✅ Crear formularios de edición de perfil para clientes
4. ✅ Ampliar formulario de edición de perfil para profesionales
5. ⏸️ Agregar validaciones adicionales según necesidad
6. ⏸️ Implementar búsqueda por campos nuevos (ciudad, provincia, especialidades, etc.)
7. ⏸️ Crear paneles de configuración de perfil en el frontend

---

## Estado Actual

✅ **Backend**: Completamente implementado
✅ **DTOs**: Actualizados con todos los campos
✅ **Schemas Frontend**: Actualizados con validaciones Zod
✅ **SQL Migration**: Creado y listo para aplicar
⏸️ **Migración DB**: Pendiente de aplicación
⏸️ **Frontend UI**: Pendiente de actualización

---

## Archivo de Migración

📄 **Ubicación**: `/profesional-api/add-client-and-professional-fields.sql`

Este archivo contiene todo el SQL necesario para agregar los campos a la base de datos, incluyendo:

- Alteración de tabla `profiles` (11 campos nuevos)
- Alteración de tabla `professional_profiles` (12 campos nuevos)
- Creación de índices para optimización
- Queries de verificación

**¡El sistema está listo para soportar perfiles completos tanto de clientes como de profesionales!** 🎉
