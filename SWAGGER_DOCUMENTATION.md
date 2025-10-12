# 📚 Documentación de API - Swagger

## Resumen de Actualización

Se ha actualizado toda la documentación de Swagger para los endpoints de pagos con detalles completos.

## 🎯 Endpoints Documentados

### 1. **POST /api/payments/mp/preference**

Crear preferencia de pago en MercadoPago

#### Descripción

Crea una preferencia de pago en MercadoPago para iniciar el checkout.

**Características:**

- ✅ Soporte para modo Sandbox (TEST) y Producción
- ✅ Configuración automática según entorno
- ✅ Información del pagador mejora tasa de aprobación
- ✅ URLs de retorno configurables
- ✅ Soporte para cuotas (hasta 12)

**Notas importantes:**

- En localhost, `auto_return` está deshabilitado (restricción de MercadoPago)
- Usar `sandbox_init_point` en modo TEST
- El `statement_descriptor` aparece en el extracto bancario

#### Request Body

```json
{
  "title": "Consulta Psicológica",
  "amount": 25000,
  "professionalSlug": "dr-juan-perez",
  "external_reference": "consultation_123",
  "payerEmail": "cliente@example.com",
  "payerName": "María",
  "payerSurname": "González"
}
```

#### Campos

| Campo                | Tipo   | Requerido | Descripción                                                          |
| -------------------- | ------ | --------- | -------------------------------------------------------------------- |
| `title`              | string | ✅        | Título del servicio o consulta (3-100 caracteres)                    |
| `amount`             | number | ✅        | Monto en pesos argentinos (mínimo 1)                                 |
| `professionalSlug`   | string | ✅        | Slug del profesional (URL-friendly, mínimo 3 caracteres)             |
| `external_reference` | string | ❌        | Referencia externa única (se genera automáticamente si no se provee) |
| `payerEmail`         | string | ❌        | Email del pagador (mejora tasa de aprobación)                        |
| `payerName`          | string | ❌        | Nombre del pagador                                                   |
| `payerSurname`       | string | ❌        | Apellido del pagador                                                 |

#### Response 201 - Success

```json
{
  "success": true,
  "preference_id": "1234567890-abc123-def456",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "external_reference": "consultation_dr-juan-perez_1234567890",
  "auto_return_enabled": false,
  "back_urls": {
    "success": "http://localhost:3000/profesionales/dr-juan-perez/pago/exito",
    "failure": "http://localhost:3000/profesionales/dr-juan-perez/pago/error",
    "pending": "http://localhost:3000/profesionales/dr-juan-perez/pago/pendiente"
  },
  "metadata": {
    "amount": 25000,
    "professional_slug": "dr-juan-perez",
    "is_sandbox": true
  }
}
```

#### Response 400 - Error

```json
{
  "statusCode": 400,
  "message": "Error creating preference: Invalid amount",
  "error": "Bad Request"
}
```

---

### 2. **POST /api/payments/webhook**

Webhook de MercadoPago (público)

#### Descripción

Recibe notificaciones de MercadoPago sobre cambios en el estado de los pagos.

**Tipos de notificaciones:**

- `payment`: Notificación de cambio de estado de pago
- `merchant_order`: Notificación de orden de merchant
- `preference`: Notificación de preferencia

**Estados de pago:**

- `approved`: Pago aprobado
- `pending`: Pago pendiente
- `rejected`: Pago rechazado
- `cancelled`: Pago cancelado

**Nota:** Este endpoint es llamado automáticamente por MercadoPago.

#### Request Body

```json
{
  "id": "12345",
  "type": "payment",
  "action": "payment.updated",
  "data": {
    "id": "67890"
  }
}
```

#### Response 200 - Success

```json
{
  "status": "ok",
  "processed": true
}
```

#### Response 200 - Error Processing

```json
{
  "status": "error",
  "processed": false,
  "error": "Payment not found"
}
```

---

### 3. **GET /api/payments/config-check**

Verificar configuración de MercadoPago (público)

#### Descripción

Verifica la configuración actual de MercadoPago y el entorno.

**Información retornada:**

- URL del frontend configurada
- Si está en localhost o producción
- Si auto_return está habilitado
- Modo sandbox o producción
- Si el token de acceso está configurado
- Recomendaciones según el entorno

**Uso:** Útil para debugging y verificar la configuración antes de crear pagos.

#### Response 200

```json
{
  "success": true,
  "config": {
    "frontend_base_url": "http://localhost:3000",
    "is_localhost": true,
    "auto_return_enabled": false,
    "is_sandbox": true,
    "has_access_token": true,
    "token_type": "TEST (Sandbox)",
    "recommended_action": "⚠️  En localhost - Usuario debe hacer clic en 'Volver al sitio' después del pago"
  }
}
```

---

### 4. **POST /api/payments/test-cards**

Información de tarjetas de prueba

#### Descripción

Retorna información sobre las tarjetas de prueba disponibles en MercadoPago.

**Tarjetas disponibles:**

**✅ APROBADAS:**

- Mastercard: `5031 7557 3453 0604` - CVV: 123 - Nombre: APRO
- Visa: `4509 9535 6623 3704` - CVV: 123 - Nombre: APRO

**❌ RECHAZADAS:**

- Visa: `4774 4612 9001 0078` - CVV: 123

**⏸️ PENDIENTES:**

- Mastercard: `5031 4332 1540 6351` - CVV: 123

**Nota:** Solo funciona en modo Sandbox (TEST).

#### Request Body

```json
{
  "bookingId": "clx1a2b3c4d5e6f7g8h9i0j1k",
  "amount": 25000,
  "cardNumber": "5031755734530604",
  "expirationMonth": "12",
  "expirationYear": "25",
  "cvv": "123",
  "cardHolderName": "APRO",
  "payerEmail": "test@example.com"
}
```

#### Response 200

```json
{
  "success": true,
  "message": "Test cards information",
  "data": {
    "cards": [
      {
        "number": "5031755734530604",
        "cvv": "123",
        "exp": "11/30",
        "status": "approved"
      },
      {
        "number": "4013540682746260",
        "cvv": "123",
        "exp": "11/30",
        "status": "rejected"
      },
      {
        "number": "5508050001234567",
        "cvv": "123",
        "exp": "11/30",
        "status": "pending"
      }
    ],
    "selectedCard": "5031755734530604",
    "amount": 1000
  }
}
```

---

### 5. **GET /api/payments/payment/:id**

Obtener información de un pago

#### Descripción

Obtiene los detalles completos de un pago por su ID.

**Información incluida:**

- Estado del pago
- Monto y comisiones
- Datos del pagador
- Información del profesional y cliente
- Historial de eventos del pago
- Datos de MercadoPago

**Estados posibles:**

- `PENDING`: Pendiente de pago
- `COMPLETED`: Pago completado exitosamente
- `FAILED`: Pago fallido o rechazado
- `CANCELLED`: Pago cancelado

#### Path Parameters

| Parámetro | Tipo   | Descripción        |
| --------- | ------ | ------------------ |
| `id`      | string | ID del pago (CUID) |

#### Response 200 - Found

```json
{
  "success": true,
  "data": {
    "id": "clx1a2b3c4d5e6f7g8h9i0j1k",
    "provider": "MERCADOPAGO",
    "preferenceId": "1234567890-abc123-def456",
    "paymentId": "67890",
    "status": "COMPLETED",
    "amount": 25000,
    "fee": 0,
    "gatewayFees": 1500,
    "platformFee": 5000,
    "netAmount": 18500,
    "currency": "ARS",
    "payerEmail": "cliente@example.com",
    "paidAt": "2025-10-12T10:30:00.000Z",
    "createdAt": "2025-10-12T10:00:00.000Z",
    "updatedAt": "2025-10-12T10:30:00.000Z",
    "booking": {},
    "events": []
  }
}
```

#### Response 200 - Not Found

```json
{
  "success": false,
  "message": "Payment not found",
  "error": "Payment with id clx1a2b3c4d5e6f7g8h9i0j1k not found"
}
```

---

## 📝 DTOs Actualizados

### CreatePreferenceDto

```typescript
{
  title: string;           // ✅ Requerido - Título del servicio (3-100 chars)
  amount: number;          // ✅ Requerido - Monto en ARS (min: 1)
  professionalSlug: string; // ✅ Requerido - Slug del profesional (min: 3 chars)
  external_reference?: string; // ❌ Opcional - Referencia única
  payerEmail?: string;     // ❌ Opcional - Email del pagador
  payerName?: string;      // ❌ Opcional - Nombre del pagador
  payerSurname?: string;   // ❌ Opcional - Apellido del pagador
}
```

### TestCardDto

```typescript
{
  bookingId: string;       // ✅ Requerido - ID de la reserva
  amount: number;          // ✅ Requerido - Monto del pago
  cardNumber: string;      // ✅ Requerido - Número de tarjeta (15-16 dígitos)
  expirationMonth: string; // ✅ Requerido - Mes de vencimiento (MM)
  expirationYear: string;  // ✅ Requerido - Año de vencimiento (YY)
  cvv: string;            // ✅ Requerido - CVV (3-4 dígitos)
  cardHolderName: string; // ✅ Requerido - Nombre del titular
  payerEmail?: string;    // ❌ Opcional - Email del pagador
}
```

---

## 🔍 Validaciones

Todos los DTOs incluyen validaciones usando `class-validator`:

- `@IsString()` - Valida que sea string
- `@IsNumber()` - Valida que sea número
- `@IsEmail()` - Valida formato de email
- `@IsNotEmpty()` - No puede estar vacío
- `@IsOptional()` - Campo opcional
- `@Min()` - Valor mínimo

---

## 🚀 Acceder a Swagger UI

Una vez que el servidor esté corriendo:

```bash
npm run start:dev
```

Abre en tu navegador:

```
http://localhost:3001/api
```

O si configuraste un puerto diferente:

```
http://localhost:{PORT}/api
```

---

## 📊 Características de la Documentación

✅ **Descripciones completas** en cada endpoint
✅ **Ejemplos de request/response** para cada caso
✅ **Códigos de estado HTTP** documentados
✅ **Tipos de datos** con validaciones
✅ **Schemas JSON** detallados
✅ **Notas y advertencias** importantes
✅ **Casos de uso** y ejemplos
✅ **Información de tarjetas de prueba**
✅ **Estados de pago** documentados

---

## 🔧 Testing desde Swagger UI

1. **Expandir un endpoint** haciendo clic en él
2. Hacer clic en **"Try it out"**
3. **Modificar** los valores del request body o parámetros
4. Hacer clic en **"Execute"**
5. Ver la **respuesta** del servidor

---

## 📚 Recursos Adicionales

- [Documentación MercadoPago](https://www.mercadopago.com.ar/developers/es/docs)
- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [NestJS Swagger Module](https://docs.nestjs.com/openapi/introduction)

---

## ✅ Estado

- ✅ Todos los endpoints documentados
- ✅ DTOs con decoradores ApiProperty
- ✅ Ejemplos completos de request/response
- ✅ Validaciones incluidas
- ✅ Build exitoso sin errores
- ✅ Swagger UI funcional

---

**Última actualización:** Octubre 12, 2025
