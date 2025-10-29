# 📬 Colección de Requests HTTP - Booking System

## 🔐 Configuración Inicial

```
API_URL: http://localhost:3000/api
PROFESSIONAL_TOKEN: <Tu token JWT de profesional>
CLIENT_TOKEN: <Tu token JWT de cliente>
```

---

## 👨‍⚕️ PROFESIONAL - Gestión de Bookings

### 1. Ver Bookings Esperando Aceptación

```http
GET {{API_URL}}/bookings/professional/waiting-bookings
Authorization: Bearer {{PROFESSIONAL_TOKEN}}
```

**Response 200:**

```json
{
  "bookings": [
    {
      "id": "clxxx123abc",
      "clientId": "user_client_123",
      "professionalId": "prof_789",
      "scheduledAt": "2025-10-17T15:00:00.000Z",
      "duration": 60,
      "price": "25000.00",
      "status": "WAITING_FOR_PROFESSIONAL",
      "meetingStatus": "WAITING",
      "jitsiRoom": "prof789-abc123",
      "client": {
        "id": "user_client_123",
        "name": "Juan Pérez",
        "email": "juan@example.com"
      },
      "payment": {
        "id": "pay_456",
        "amount": "25000.00",
        "status": "COMPLETED",
        "paidAt": "2025-10-17T14:30:00.000Z"
      },
      "createdAt": "2025-10-17T14:25:00.000Z",
      "updatedAt": "2025-10-17T14:30:00.000Z"
    }
  ],
  "count": 1,
  "message": "1 booking(s) waiting for your acceptance"
}
```

---

### 2. Aceptar Booking

```http
PATCH {{API_URL}}/bookings/clxxx123abc/accept-meeting
Authorization: Bearer {{PROFESSIONAL_TOKEN}}
```

**Response 200:**

```json
{
  "id": "clxxx123abc",
  "clientId": "user_client_123",
  "professionalId": "prof_789",
  "status": "CONFIRMED",
  "meetingStatus": "WAITING",
  "meetingAcceptedAt": "2025-10-17T15:00:00.000Z",
  "jitsiRoom": "prof789-abc123",
  "canJoinMeeting": true,
  "message": "Booking confirmed. Both parties can now join the meeting.",
  "client": {
    "id": "user_client_123",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  },
  "professional": {
    "id": "prof_789",
    "name": "Dra. María González",
    "email": "maria@example.com"
  }
}
```

**Response 403 (No autorizado):**

```json
{
  "statusCode": 403,
  "message": "Not authorized to accept this meeting"
}
```

**Response 400 (Estado incorrecto):**

```json
{
  "statusCode": 400,
  "message": "Booking is not waiting for professional acceptance. Current status: CONFIRMED"
}
```

---

### 3. Ver Reuniones Pendientes

```http
GET {{API_URL}}/bookings/professional/meetings
Authorization: Bearer {{PROFESSIONAL_TOKEN}}
```

**Response 200:**

```json
{
  "meetings": [
    {
      "id": "clxxx123abc",
      "status": "CONFIRMED",
      "meetingStatus": "WAITING",
      "scheduledAt": "2025-10-17T15:00:00.000Z",
      "client": {
        "id": "user_client_123",
        "name": "Juan Pérez",
        "email": "juan@example.com"
      }
    }
  ],
  "count": 1
}
```

---

## 👤 CLIENTE - Gestión de Bookings

### 1. Ver Mis Bookings

```http
GET {{API_URL}}/bookings/client/my-bookings
Authorization: Bearer {{CLIENT_TOKEN}}
```

**Response 200:**

```json
{
  "bookings": [
    {
      "id": "clxxx123abc",
      "professionalId": "prof_789",
      "scheduledAt": "2025-10-17T15:00:00.000Z",
      "duration": 60,
      "price": "25000.00",
      "status": "CONFIRMED",
      "meetingStatus": "WAITING",
      "jitsiRoom": "prof789-abc123",
      "professional": {
        "id": "prof_789",
        "name": "Dra. María González",
        "email": "maria@example.com",
        "bio": "Psicóloga especializada...",
        "pricePerSession": "25000.00"
      },
      "payment": {
        "id": "pay_456",
        "amount": "25000.00",
        "status": "COMPLETED",
        "paidAt": "2025-10-17T14:30:00.000Z"
      }
    }
  ],
  "count": 1,
  "grouped": {
    "pending_payment": [],
    "waiting_acceptance": [],
    "confirmed": [
      {
        "id": "clxxx123abc",
        "status": "CONFIRMED",
        "professional": {
          "name": "Dra. María González"
        }
      }
    ],
    "in_progress": [],
    "completed": [],
    "cancelled": []
  }
}
```

---

### 2. Ver Detalles de un Booking

```http
GET {{API_URL}}/bookings/clxxx123abc
Authorization: Bearer {{CLIENT_TOKEN}}
```

**Response 200:**

```json
{
  "id": "clxxx123abc",
  "clientId": "user_client_123",
  "professionalId": "prof_789",
  "scheduledAt": "2025-10-17T15:00:00.000Z",
  "duration": 60,
  "price": "25000.00",
  "status": "CONFIRMED",
  "meetingStatus": "WAITING",
  "jitsiRoom": "prof789-abc123",
  "client": {
    "id": "user_client_123",
    "email": "juan@example.com"
  },
  "professional": {
    "id": "prof_789",
    "name": "Dra. María González",
    "email": "maria@example.com"
  },
  "payment": {
    "id": "pay_456",
    "amount": "25000.00",
    "status": "COMPLETED"
  }
}
```

---

## 🎥 VIDEOLLAMADA - Ambos

### 1. Verificar si Puede Unirse

```http
GET {{API_URL}}/bookings/clxxx123abc/join-meeting
Authorization: Bearer {{CLIENT_TOKEN}}
# o
Authorization: Bearer {{PROFESSIONAL_TOKEN}}
```

**Response 200 (Puede unirse):**

```json
{
  "canJoin": true,
  "jitsiRoom": "prof789-abc123",
  "role": "client",
  "meetingStatus": "WAITING",
  "bookingStatus": "CONFIRMED"
}
```

**Response 400 (No puede unirse todavía):**

```json
{
  "statusCode": 400,
  "message": "Meeting is not ready to join. Current status: WAITING_FOR_PROFESSIONAL"
}
```

**Response 403 (No autorizado):**

```json
{
  "statusCode": 403,
  "message": "Not authorized to join this meeting"
}
```

---

### 2. Iniciar Reunión (Al Unirse)

```http
POST {{API_URL}}/bookings/clxxx123abc/start-meeting
Authorization: Bearer {{CLIENT_TOKEN}}
# o
Authorization: Bearer {{PROFESSIONAL_TOKEN}}
```

**Response 200:**

```json
{
  "id": "clxxx123abc",
  "clientId": "user_client_123",
  "professionalId": "prof_789",
  "status": "IN_PROGRESS",
  "meetingStatus": "ACTIVE",
  "jitsiRoom": "prof789-abc123",
  "meetingStartTime": "2025-10-17T15:05:00.000Z",
  "meetingEndTime": "2025-10-17T15:23:00.000Z",
  "remainingTime": 1080000,
  "client": {
    "id": "user_client_123",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  },
  "professional": {
    "id": "prof_789",
    "name": "Dra. María González",
    "email": "maria@example.com"
  }
}
```

**Response 400 (Ya está iniciada):**

```json
{
  "statusCode": 400,
  "message": "Meeting cannot be started. Current status: IN_PROGRESS"
}
```

---

### 3. Ver Estado de la Reunión

```http
GET {{API_URL}}/bookings/clxxx123abc/meeting-status
Authorization: Bearer {{CLIENT_TOKEN}}
# o
Authorization: Bearer {{PROFESSIONAL_TOKEN}}
```

**Response 200:**

```json
{
  "bookingId": "clxxx123abc",
  "jitsiRoom": "prof789-abc123",
  "meetingStatus": "ACTIVE",
  "meetingStartTime": "2025-10-17T15:05:00.000Z",
  "meetingEndTime": "2025-10-17T15:23:00.000Z",
  "remainingTime": 900000
}
```

---

## 🔔 NOTIFICACIONES - Ambos

### 1. Ver Notificaciones

```http
GET {{API_URL}}/notifications
Authorization: Bearer {{CLIENT_TOKEN}}
# o
Authorization: Bearer {{PROFESSIONAL_TOKEN}}
```

**Response 200:**

```json
{
  "notifications": [
    {
      "id": "notif_123",
      "userId": "user_client_123",
      "type": "BOOKING_CONFIRMED",
      "title": "Consulta confirmada",
      "message": "Dra. María González ha aceptado tu solicitud de consulta. Ya puedes unirte a la videollamada.",
      "read": false,
      "payload": {
        "bookingId": "clxxx123abc",
        "professionalName": "Dra. María González",
        "jitsiRoom": "prof789-abc123",
        "canJoinNow": true
      },
      "createdAt": "2025-10-17T15:00:00.000Z"
    }
  ],
  "unreadCount": 1
}
```

---

## 💳 PAGOS - Cliente

### 1. Crear Booking + Preferencia de Pago (Flujo Simple)

```http
POST {{API_URL}}/payments/mp/simple-preference
Content-Type: application/json

{
  "clientId": "user_client_123",
  "professionalId": "prof_789",
  "professionalSlug": "dra-maria-gonzalez",
  "scheduledAt": "2025-10-18T15:00:00.000Z",
  "duration": 60,
  "price": 25000,
  "title": "Consulta Psicológica",
  "description": "Sesión de 60 minutos",
  "payerEmail": "juan@example.com"
}
```

**Response 201:**

```json
{
  "success": true,
  "booking_id": "clxxx123abc",
  "preference_id": "12345-abc-67890",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=12345-abc-67890",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=12345-abc-67890",
  "payment_id": "pay_456",
  "amount": 25000,
  "mode": "simple_test",
  "booking_details": {
    "id": "clxxx123abc",
    "scheduledAt": "2025-10-18T15:00:00.000Z",
    "duration": 60,
    "status": "PENDING_PAYMENT",
    "jitsiRoom": "prof789-abc123"
  },
  "warning": "⚠️  Este es un endpoint de testing - NO usa split payments",
  "metadata": {
    "is_sandbox": true,
    "back_urls": {
      "success": "http://localhost:3000/profesionales/dra-maria-gonzalez/pago/exito",
      "failure": "http://localhost:3000/profesionales/dra-maria-gonzalez/pago/error",
      "pending": "http://localhost:3000/profesionales/dra-maria-gonzalez/pago/pendiente"
    }
  }
}
```

---

## 🧪 TESTING - Secuencia Completa

### Flujo End-to-End

#### Paso 1: Cliente crea booking y paga

```http
POST {{API_URL}}/payments/mp/simple-preference
Content-Type: application/json

{
  "clientId": "user_client_123",
  "professionalId": "prof_789",
  "professionalSlug": "dra-maria-gonzalez",
  "scheduledAt": "2025-10-18T15:00:00.000Z",
  "duration": 60,
  "price": 25000,
  "title": "Consulta Psicológica",
  "payerEmail": "juan@example.com"
}
```

#### Paso 2: Simular webhook de MercadoPago (pago aprobado)

```http
POST {{API_URL}}/payments/webhook
Content-Type: application/json

{
  "id": 123456789,
  "type": "payment",
  "action": "payment.updated",
  "data": {
    "id": "123456789"
  }
}
```

#### Paso 3: Profesional ve bookings pendientes

```http
GET {{API_URL}}/bookings/professional/waiting-bookings
Authorization: Bearer {{PROFESSIONAL_TOKEN}}
```

#### Paso 4: Profesional acepta booking

```http
PATCH {{API_URL}}/bookings/{{booking_id}}/accept-meeting
Authorization: Bearer {{PROFESSIONAL_TOKEN}}
```

#### Paso 5: Cliente verifica que puede unirse

```http
GET {{API_URL}}/bookings/{{booking_id}}/join-meeting
Authorization: Bearer {{CLIENT_TOKEN}}
```

#### Paso 6: Cliente inicia la reunión

```http
POST {{API_URL}}/bookings/{{booking_id}}/start-meeting
Authorization: Bearer {{CLIENT_TOKEN}}
```

#### Paso 7: Verificar estado de la reunión

```http
GET {{API_URL}}/bookings/{{booking_id}}/meeting-status
Authorization: Bearer {{CLIENT_TOKEN}}
```

---

## 📝 Notas Importantes

1. **Tokens JWT**: Obtén los tokens haciendo login en `/api/auth/login`

2. **Sandbox MercadoPago**: Usa tarjetas de prueba:
   - Aprobada: `5031 7557 3453 0604` (CVV: 123, Venc: 11/25)

3. **Webhook Local**: Para testing local con webhook:

   ```bash
   # Usar ngrok para exponer localhost
   ngrok http 3000

   # Actualizar APP_URL en .env con la URL de ngrok
   APP_URL=https://abc123.ngrok.io
   ```

4. **Estados**: Verifica siempre el estado actual antes de hacer acciones

5. **Timer**: La reunión se finaliza automáticamente en 18 minutos

---

## 🔧 Variables para Postman/Thunder Client

```json
{
  "API_URL": "http://localhost:3000/api",
  "CLIENT_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "PROFESSIONAL_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "booking_id": "clxxx123abc"
}
```

---

## 📚 Recursos

- [Documentación Frontend](./BOOKING-FLOW-FRONTEND.md)
- [Documentación Backend](./BOOKING-BACKEND-SUMMARY.md)
- [Guía Completa](./IMPLEMENTACION-COMPLETA.md)
- [Script de Testing](./test-booking-flow.sh)

---

¡Listo para testear! 🚀
