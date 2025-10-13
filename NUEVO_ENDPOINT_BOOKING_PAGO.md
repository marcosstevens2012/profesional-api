# 🎯 Endpoint Actualizado: Crear Booking + Pago Automáticamente

## ✅ Cambio Implementado

El endpoint `POST /api/payments/mp/simple-preference` ahora:

1. ✅ **Crea el Booking automáticamente**
2. ✅ **Crea el Payment record**
3. ✅ **Genera la Jitsi room**
4. ✅ **Crea la preferencia de MercadoPago**
5. ✅ **Retorna toda la información necesaria**

---

## 📡 Request: POST `/api/payments/mp/simple-preference`

### Headers

```
Content-Type: application/json
```

### Body (JSON)

```json
{
  "clientId": "clxxx123...",
  "professionalId": "clyyy456...",
  "scheduledAt": "2025-10-20T15:00:00Z",
  "duration": 60,
  "price": 45000,
  "notes": "Primera consulta, necesito ayuda con...",
  "title": "Consulta Psicológica - Dr. Juan Pérez",
  "description": "Sesión de terapia online",
  "payerEmail": "cliente@example.com",
  "professionalSlug": "dr-juan-perez"
}
```

### Campos Requeridos

| Campo              | Tipo              | Descripción                      | Ejemplo                  |
| ------------------ | ----------------- | -------------------------------- | ------------------------ |
| `clientId`         | string            | ID del usuario cliente           | `"clxxx123..."`          |
| `professionalId`   | string            | ID del perfil profesional        | `"clyyy456..."`          |
| `scheduledAt`      | string (ISO 8601) | Fecha y hora de la consulta      | `"2025-10-20T15:00:00Z"` |
| `price`            | number            | Precio de la consulta en ARS     | `45000`                  |
| `title`            | string            | Título para MercadoPago          | `"Consulta Psicológica"` |
| `professionalSlug` | string            | Slug del profesional (para URLs) | `"dr-juan-perez"`        |

### Campos Opcionales

| Campo         | Tipo   | Descripción           | Default           |
| ------------- | ------ | --------------------- | ----------------- |
| `duration`    | number | Duración en minutos   | `60`              |
| `notes`       | string | Notas del cliente     | `null`            |
| `description` | string | Descripción adicional | Mismo que `title` |
| `payerEmail`  | string | Email del pagador     | Email del cliente |

---

## 📤 Response

### Success (201 Created)

```json
{
  "success": true,
  "booking_id": "clzzz789...",
  "preference_id": "1234567-abc-def",
  "init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "payment_id": "clppp999...",
  "amount": 45000,
  "mode": "simple_test",
  "booking_details": {
    "id": "clzzz789...",
    "scheduledAt": "2025-10-20T15:00:00.000Z",
    "duration": 60,
    "status": "PENDING_PAYMENT",
    "jitsiRoom": "clyyy456-a1b2c3d4",
    "client": {
      "id": "clxxx123...",
      "email": "cliente@example.com",
      "name": "Juan Cliente"
    },
    "professional": {
      "id": "clyyy456...",
      "name": "Dr. Juan Pérez"
    }
  },
  "warning": "⚠️  Este es un endpoint de testing - NO usa split payments",
  "metadata": {
    "is_sandbox": true,
    "back_urls": {
      "success": "http://localhost:3000/profesionales/dr-juan-perez/pago/exito",
      "failure": "http://localhost:3000/profesionales/dr-juan-perez/pago/error",
      "pending": "http://localhost:3000/profesionales/dr-juan-perez/pago/pendiente"
    }
  }
}
```

### Error (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "Professional clyyy456... not found",
  "error": "Bad Request"
}
```

**Posibles errores:**

- `Professional {id} not found` - El ID del profesional no existe
- `Professional {id} is not active` - El profesional está inactivo
- `Client {id} not found` - El ID del cliente no existe

---

## 🎯 Ejemplo de Uso desde Frontend

### React/Next.js Example

```typescript
async function crearPagoYReserva() {
  try {
    const response = await fetch('http://localhost:3001/api/payments/mp/simple-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: 'clxxx123...', // Obtener del usuario logueado
        professionalId: 'clyyy456...', // Obtener de la página del profesional
        scheduledAt: '2025-10-20T15:00:00Z', // Fecha seleccionada por el usuario
        duration: 60,
        price: 45000,
        notes: 'Primera consulta',
        title: 'Consulta Psicológica - Dr. Juan Pérez',
        description: 'Sesión de terapia online',
        payerEmail: 'cliente@example.com',
        professionalSlug: 'dr-juan-perez',
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Booking creado:', data.booking_id);
      console.log('✅ Payment creado:', data.payment_id);
      console.log('✅ Jitsi room:', data.booking_details.jitsiRoom);

      // Redirigir al checkout de MercadoPago
      window.location.href = data.init_point;
    } else {
      console.error('❌ Error:', data.message);
    }
  } catch (error) {
    console.error('❌ Error de red:', error);
  }
}
```

### cURL Example (Testing)

```bash
curl -X POST http://localhost:3001/api/payments/mp/simple-preference \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "clxxx123...",
    "professionalId": "clyyy456...",
    "scheduledAt": "2025-10-20T15:00:00Z",
    "duration": 60,
    "price": 45000,
    "notes": "Primera consulta",
    "title": "Consulta Psicológica",
    "description": "Sesión de terapia",
    "payerEmail": "test@example.com",
    "professionalSlug": "dr-juan-perez"
  }'
```

---

## 🔄 Flujo Completo

```
1. Frontend llama a POST /api/payments/mp/simple-preference
   ├─ Valida datos de entrada
   ├─ Verifica que profesional existe y está activo
   ├─ Verifica que cliente existe
   └─ Crea Booking con status PENDING_PAYMENT
       └─ Genera jitsiRoom único

2. Backend crea Payment record
   ├─ amount = price (sin comisión en modo testing)
   ├─ status = PENDING
   └─ metadata incluye bookingId

3. Backend crea preferencia en MercadoPago
   ├─ items: título, precio
   ├─ external_reference = booking.id
   ├─ payer: email del cliente
   └─ back_urls: URLs de retorno

4. Backend retorna init_point

5. Frontend redirige a MercadoPago checkout

6. Usuario completa el pago en MercadoPago

7. MercadoPago envía webhook a /api/payments/webhook
   ├─ Backend actualiza Payment status → COMPLETED
   ├─ Backend actualiza Booking status → WAITING_FOR_PROFESSIONAL
   └─ Backend crea Notification para el profesional

8. Usuario es redirigido a success URL
```

---

## 🧪 Testing

### 1. Obtener IDs necesarios

Primero necesitas obtener los IDs de cliente y profesional. Puedes usar estos endpoints:

```bash
# Listar usuarios (para obtener clientId)
GET http://localhost:3001/api/users

# Listar profesionales (para obtener professionalId)
GET http://localhost:3001/api/profiles
```

### 2. Crear booking + pago

```bash
curl -X POST http://localhost:3001/api/payments/mp/simple-preference \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "TU_CLIENT_ID_AQUI",
    "professionalId": "TU_PROFESSIONAL_ID_AQUI",
    "scheduledAt": "2025-10-20T15:00:00Z",
    "price": 5000,
    "title": "Consulta de Prueba",
    "professionalSlug": "test"
  }'
```

### 3. Obtener init_point de la respuesta

```json
{
  "init_point": "https://sandbox.mercadopago.com.ar/checkout/..."
}
```

### 4. Abrir init_point en navegador

```bash
# O copiar y pegar en navegador
open "https://sandbox.mercadopago.com.ar/checkout/..."
```

### 5. Completar pago

**Opción A: Dinero en cuenta (Recomendado)**

- Seleccionar "Dinero en cuenta de MercadoPago"
- Login con usuario de prueba (crear en: https://www.mercadopago.com.ar/developers/panel/test-users)
- Aprobar el pago

**Opción B: Tarjeta de prueba**

```
Número: 4509 9535 6623 3704
CVV: 123
Vencimiento: 11/25
Nombre: APRO
```

### 6. Simular webhook (porque localhost no es accesible)

```bash
# Obtener el booking_id de la respuesta del paso 2
# Buscar el payment en la base de datos o logs

curl -X POST http://localhost:3001/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": 999999,
    "type": "payment",
    "action": "payment.updated",
    "data": {
      "id": "TU_MP_PAYMENT_ID_AQUI"
    }
  }'
```

---

## 📊 Verificar Resultados

### Check Booking

```bash
GET http://localhost:3001/api/bookings/{booking_id}
```

Debería mostrar:

- `status`: `"WAITING_FOR_PROFESSIONAL"` (después del webhook)
- `paymentId`: ID del payment creado
- `jitsiRoom`: Nombre de la sala generada

### Check Payment

```bash
GET http://localhost:3001/api/payments/{payment_id}
```

Debería mostrar:

- `status`: `"COMPLETED"` (después del webhook)
- `amount`: Precio de la consulta
- `preferenceId`: ID de la preferencia de MP

---

## ⚠️ Notas Importantes

### En Desarrollo (localhost)

1. **Webhook no llega automáticamente**
   - MercadoPago no puede acceder a localhost
   - Debes simular el webhook con curl
   - O usar ngrok para exponer localhost

2. **Usuario de prueba recomendado**
   - Crear en: https://www.mercadopago.com.ar/developers/panel/test-users
   - Tipo: Comprador (Buyer)
   - Usar "Dinero en cuenta" es más confiable que tarjetas

### En Producción (Railway)

1. **Webhook funcionará automáticamente**
   - Configurar `APP_URL` con URL de Railway
   - MercadoPago enviará webhooks sin problemas

2. **Back URLs**
   - Configurar `FRONTEND_BASE_URL` con URL de Vercel
   - Usuarios serán redirigidos correctamente después del pago

---

## 🎓 Diferencias con Endpoint Original

| Feature             | `/mp/preference` (original) | `/mp/simple-preference` (nuevo) |
| ------------------- | --------------------------- | ------------------------------- |
| Crea booking        | ❌ No (requiere bookingId)  | ✅ Sí (automático)              |
| Split payments      | ✅ Sí (marketplace)         | ❌ No                           |
| Comisión plataforma | ✅ Calcula                  | ❌ No (0%)                      |
| Para testing        | ⚠️ Limitado                 | ✅ Ideal                        |
| Para producción     | ✅ Recomendado              | ⚠️ Solo si no necesitas split   |

---

## 🚀 Próximos Pasos

1. **Actualizar tu frontend** para usar el nuevo endpoint
2. **Crear usuarios de prueba** en MercadoPago
3. **Probar flujo completo** con "Dinero en cuenta"
4. **Deploy a Railway** para que webhooks funcionen automáticamente
5. **(Opcional) Migrar a split_payments** cuando profesionales tengan cuentas de MP

---

## 📚 Referencias

- **Panel de testing MP:** https://www.mercadopago.com.ar/developers/panel/testing
- **Crear usuarios de prueba:** https://www.mercadopago.com.ar/developers/panel/test-users
- **Docs de Checkout Pro:** https://www.mercadopago.com.ar/developers/es/docs/checkout-pro
