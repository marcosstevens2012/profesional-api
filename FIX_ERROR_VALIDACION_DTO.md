# 🐛 Error: Validación de CreateSimplePreferenceDto

## ❌ Error Recibido

```
"property amount should not exist"
"clientId should not be empty"
"clientId must be a string"
"professionalId should not be empty"
"professionalId must be a string"
"scheduledAt should not be empty"
"scheduledAt must be a string"
"price must not be less than 1"
"price must be a number conforming to the specified constraints"
```

## 🎯 Causa del Error

El DTO `CreateSimplePreferenceDto` espera campos específicos. El error indica que:

1. ❌ Estás enviando `amount` pero el DTO espera `price`
2. ❌ Los otros campos no se están enviando correctamente

## ✅ Solución: Formato Correcto del Request

### Request Body Correcto

```json
{
  "clientId": "clxxx123456...",
  "professionalId": "clyyy789012...",
  "scheduledAt": "2025-10-20T15:00:00.000Z",
  "price": 45000,
  "title": "Consulta Psicológica - Dr. Juan Pérez",
  "professionalSlug": "dr-juan-perez",
  "duration": 60,
  "notes": "Primera consulta",
  "description": "Sesión de terapia online",
  "payerEmail": "cliente@example.com"
}
```

### Campos Obligatorios

| Campo              | Tipo         | Ejemplo                  | Descripción               |
| ------------------ | ------------ | ------------------------ | ------------------------- |
| `clientId`         | string       | `"clxxx123..."`          | ID del usuario cliente    |
| `professionalId`   | string       | `"clyyy789..."`          | ID del perfil profesional |
| `scheduledAt`      | string (ISO) | `"2025-10-20T15:00:00Z"` | Fecha de la consulta      |
| `price`            | number       | `45000`                  | **NO `amount`** ⚠️        |
| `title`            | string       | `"Consulta..."`          | Título para MP            |
| `professionalSlug` | string       | `"dr-juan-perez"`        | Slug del profesional      |

### Campos Opcionales

| Campo         | Tipo   | Default           | Ejemplo                |
| ------------- | ------ | ----------------- | ---------------------- |
| `duration`    | number | `60`              | Minutos de la consulta |
| `notes`       | string | `null`            | Notas del cliente      |
| `description` | string | = `title`         | Descripción adicional  |
| `payerEmail`  | string | email del cliente | Email del pagador      |

## 🧪 Ejemplo Completo con cURL

```bash
curl -X POST http://localhost:3001/api/payments/mp/simple-preference \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "clxxx123456789",
    "professionalId": "clyyy987654321",
    "scheduledAt": "2025-10-20T15:00:00.000Z",
    "price": 45000,
    "title": "Consulta Psicológica - Dr. Juan Pérez",
    "professionalSlug": "dr-juan-perez",
    "duration": 60,
    "notes": "Primera consulta, necesito ayuda con ansiedad",
    "description": "Sesión de terapia online de 60 minutos",
    "payerEmail": "cliente@example.com"
  }'
```

## 📝 Ejemplo con Fetch (JavaScript/TypeScript)

```typescript
const response = await fetch('http://localhost:3001/api/payments/mp/simple-preference', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    clientId: 'clxxx123456789',
    professionalId: 'clyyy987654321',
    scheduledAt: new Date('2025-10-20T15:00:00Z').toISOString(),
    price: 45000, // ⚠️ NO uses "amount"
    title: 'Consulta Psicológica - Dr. Juan Pérez',
    professionalSlug: 'dr-juan-perez',
    duration: 60,
    notes: 'Primera consulta',
    description: 'Sesión de terapia online',
    payerEmail: 'cliente@example.com',
  }),
});

const data = await response.json();
console.log(data);
```

## 🔍 Cómo Obtener los IDs Necesarios

### 1. Obtener `clientId`

El `clientId` es el ID del **usuario** (tabla `users`), NO del perfil profesional.

```bash
# Listar usuarios
GET http://localhost:3001/api/users

# O buscar por email
GET http://localhost:3001/api/users?email=cliente@example.com
```

**Ejemplo de respuesta:**

```json
{
  "id": "clxxx123456789", // ← Este es el clientId
  "email": "cliente@example.com",
  "name": "Juan Cliente"
}
```

### 2. Obtener `professionalId`

El `professionalId` es el ID del **perfil profesional** (tabla `professional_profiles`).

```bash
# Listar profesionales
GET http://localhost:3001/api/profiles

# O buscar específico
GET http://localhost:3001/api/profiles/{id}
```

**Ejemplo de respuesta:**

```json
{
  "id": "clyyy987654321", // ← Este es el professionalId
  "name": "Dr. Juan Pérez",
  "email": "dr.perez@example.com",
  "pricePerSession": 45000,
  "isActive": true
}
```

## ⚠️ Errores Comunes

### Error 1: "property amount should not exist"

❌ **Incorrecto:**

```json
{
  "amount": 45000 // ← Nombre incorrecto
}
```

✅ **Correcto:**

```json
{
  "price": 45000 // ← Nombre correcto
}
```

### Error 2: "clientId should not be empty"

❌ **Incorrecto:**

```json
{
  "userId": "clxxx123" // ← Campo incorrecto
}
```

✅ **Correcto:**

```json
{
  "clientId": "clxxx123" // ← Campo correcto
}
```

### Error 3: "scheduledAt must be a string"

❌ **Incorrecto:**

```json
{
  "scheduledAt": 1634567890000 // ← Timestamp numérico
}
```

✅ **Correcto:**

```json
{
  "scheduledAt": "2025-10-20T15:00:00.000Z" // ← ISO 8601 string
}
```

## 🧪 Testing Paso a Paso

### Paso 1: Crear o identificar un usuario cliente

```bash
# Opción A: Listar usuarios existentes
curl http://localhost:3001/api/users

# Opción B: Crear nuevo usuario (si tienes endpoint de registro)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente.test@example.com",
    "password": "password123",
    "name": "Cliente Test"
  }'
```

Guarda el `id` del usuario: **`clientId`**

### Paso 2: Identificar un profesional

```bash
curl http://localhost:3001/api/profiles
```

Guarda el `id` del profesional: **`professionalId`**

### Paso 3: Crear booking + preferencia

```bash
curl -X POST http://localhost:3001/api/payments/mp/simple-preference \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "TU_CLIENT_ID_AQUI",
    "professionalId": "TU_PROFESSIONAL_ID_AQUI",
    "scheduledAt": "2025-10-20T15:00:00.000Z",
    "price": 5000,
    "title": "Consulta de Prueba",
    "professionalSlug": "test"
  }'
```

### Paso 4: Verificar respuesta exitosa

```json
{
  "success": true,
  "booking_id": "clzzz...",
  "payment_id": "clppp...",
  "preference_id": "1234-abc",
  "init_point": "https://sandbox.mercadopago.com.ar/checkout/...",
  "booking_details": {
    "id": "clzzz...",
    "scheduledAt": "2025-10-20T15:00:00.000Z",
    "status": "PENDING_PAYMENT",
    "jitsiRoom": "clyyy456-a1b2c3d4"
  }
}
```

## 📋 Checklist de Validación

Antes de hacer el request, verifica:

- [ ] `clientId` es un string válido (ID de tabla `users`)
- [ ] `professionalId` es un string válido (ID de tabla `professional_profiles`)
- [ ] `scheduledAt` es un string ISO 8601 (formato: `"2025-10-20T15:00:00.000Z"`)
- [ ] `price` es un número (NO string, NO se llama `amount`)
- [ ] `price` es mayor a 0
- [ ] `title` es un string no vacío
- [ ] `professionalSlug` es un string no vacío
- [ ] `duration` (opcional) es un número >= 15
- [ ] `payerEmail` (opcional) es un email válido

## 🎯 Resumen

**El problema principal:** Estás usando nombres de campos incorrectos.

**La solución:** Usa exactamente estos nombres:

- ✅ `price` (NO `amount`)
- ✅ `clientId` (NO `userId`)
- ✅ `professionalId`
- ✅ `scheduledAt` (string ISO 8601)
- ✅ `title`
- ✅ `professionalSlug`

**Ejemplo mínimo que funciona:**

```json
{
  "clientId": "clxxx123",
  "professionalId": "clyyy456",
  "scheduledAt": "2025-10-20T15:00:00Z",
  "price": 5000,
  "title": "Test",
  "professionalSlug": "test"
}
```
