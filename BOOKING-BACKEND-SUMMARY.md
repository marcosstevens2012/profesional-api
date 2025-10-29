# 📚 Resumen Técnico Backend - Sistema de Bookings

## 🎯 Endpoints Implementados

### Profesional - Gestión de Bookings

| Método  | Endpoint                                      | Descripción                           | Auth         |
| ------- | --------------------------------------------- | ------------------------------------- | ------------ |
| `GET`   | `/api/bookings/professional/waiting-bookings` | Obtener bookings esperando aceptación | Professional |
| `GET`   | `/api/bookings/professional/meetings`         | Obtener reuniones pendientes          | Professional |
| `PATCH` | `/api/bookings/:id/accept-meeting`            | Aceptar un booking                    | Professional |

### Cliente - Gestión de Bookings

| Método | Endpoint                           | Descripción                            | Auth   |
| ------ | ---------------------------------- | -------------------------------------- | ------ |
| `GET`  | `/api/bookings/client/my-bookings` | Obtener todos los bookings del cliente | Client |
| `POST` | `/api/bookings/:id/payment`        | Crear pago para booking                | Client |

### Ambos - Reuniones

| Método | Endpoint                           | Descripción                    | Auth          |
| ------ | ---------------------------------- | ------------------------------ | ------------- |
| `GET`  | `/api/bookings/:id`                | Obtener detalles de un booking | Authenticated |
| `GET`  | `/api/bookings/:id/join-meeting`   | Verificar si puede unirse      | Authenticated |
| `POST` | `/api/bookings/:id/start-meeting`  | Iniciar reunión (al unirse)    | Authenticated |
| `GET`  | `/api/bookings/:id/meeting-status` | Estado actual de la reunión    | Authenticated |

---

## 🔄 Estados del Sistema

### BookingStatus (Estado del Booking)

```typescript
enum BookingStatus {
  PENDING_PAYMENT           // Cliente creó booking, esperando pago
  WAITING_FOR_PROFESSIONAL  // Pago aprobado, esperando que profesional acepte
  PENDING                   // [No usado actualmente]
  CONFIRMED                 // Profesional aceptó, listo para unirse
  IN_PROGRESS              // Reunión en curso
  COMPLETED                // Reunión finalizada
  CANCELLED                // Cancelado
  NO_SHOW                  // Cliente no se presentó
}
```

### MeetingStatus (Estado de la Reunión)

```typescript
enum MeetingStatus {
  PENDING    // Antes del pago
  WAITING    // Cliente pagó, esperando que profesional acepte
  ACTIVE     // Reunión en curso
  COMPLETED  // Reunión finalizada
  CANCELLED  // Reunión cancelada
  EXPIRED    // Tiempo de espera agotado
}
```

---

## 📊 Flujo Técnico Detallado

### 1. Creación del Booking + Pago

```typescript
// Endpoint: POST /api/payments/mp/simple-preference
// Servicio: PaymentsService.createSimplePreference()

Flujo:
1. Verificar profesional existe y está activo
2. Verificar cliente existe
3. Generar jitsiRoom único: `${professionalId.slice(-8)}-${uuid()}`
4. Crear Booking:
   - status: PENDING_PAYMENT
   - meetingStatus: PENDING
   - jitsiRoom: generado
5. Crear Payment:
   - status: PENDING
   - amount: precio de la consulta
6. Vincular Payment con Booking
7. Crear preferencia en MercadoPago
8. Retornar init_point para checkout

Estado final:
- Booking: PENDING_PAYMENT
- Meeting: PENDING
- Payment: PENDING
```

### 2. Webhook de MercadoPago (Pago Aprobado)

```typescript
// Endpoint: POST /api/payments/webhook (llamado por MercadoPago)
// Servicio: PaymentsService.handleWebhook()

Flujo:
1. Recibir notificación de MP (payment.updated)
2. Obtener payment details desde MP API
3. Buscar Booking por external_reference
4. Actualizar Payment:
   - status: COMPLETED
   - paidAt: now
5. Actualizar Booking:
   - status: WAITING_FOR_PROFESSIONAL
   - meetingStatus: WAITING
6. Crear Notification para profesional:
   - type: BOOKING_REQUEST
   - mensaje: "Nueva solicitud de consulta pagada"

Estado final:
- Booking: WAITING_FOR_PROFESSIONAL
- Meeting: WAITING
- Payment: COMPLETED
```

### 3. Profesional Acepta el Booking

```typescript
// Endpoint: PATCH /api/bookings/:id/accept-meeting
// Servicio: BookingsService.acceptMeeting()

Flujo:
1. Verificar que es el profesional correcto
2. Verificar que booking está en WAITING_FOR_PROFESSIONAL
3. Verificar límite de reuniones (max 1 activa + 1 en espera)
4. Actualizar Booking:
   - status: CONFIRMED
   - meetingAcceptedAt: now
5. Crear Notification para cliente:
   - type: BOOKING_CONFIRMED
   - mensaje: "Tu consulta ha sido confirmada"
   - payload: { canJoinNow: true, jitsiRoom: ... }

Estado final:
- Booking: CONFIRMED
- Meeting: WAITING (todavía no iniciado)
- Payment: COMPLETED
```

### 4. Usuario Se Une a la Videollamada

```typescript
// Endpoint: POST /api/bookings/:id/start-meeting
// Servicio: BookingsService.startMeeting()

Flujo:
1. Verificar que usuario es parte del booking
2. Verificar que booking está en CONFIRMED
3. Actualizar Booking:
   - status: IN_PROGRESS
   - meetingStatus: ACTIVE
   - meetingStartTime: now
   - meetingEndTime: now + 18 minutos
4. Programar finalización automática (setTimeout 18 min)

Estado final:
- Booking: IN_PROGRESS
- Meeting: ACTIVE
- Payment: COMPLETED
```

### 5. Finalización Automática (18 minutos)

```typescript
// Método: BookingsService.endMeetingAutomatically()

Flujo:
1. Ejecutar después de 18 minutos (setTimeout)
2. Actualizar Booking:
   - status: COMPLETED
   - meetingStatus: COMPLETED
   - meetingEndTime: now

Estado final:
- Booking: COMPLETED
- Meeting: COMPLETED
- Payment: COMPLETED
```

---

## 🔐 Seguridad y Validaciones

### Validación de Permisos

```typescript
// En acceptMeeting():
if (booking.professional.user?.id !== professionalUserId) {
  throw new ForbiddenException('Not authorized');
}

// En canUserJoinMeeting():
const isClient = booking.clientId === userId;
const isProfessional = booking.professional.user?.id === userId;
if (!isClient && !isProfessional) {
  throw new ForbiddenException('Not authorized');
}
```

### Validación de Estados

```typescript
// Solo puede aceptar si está esperando
if (booking.status !== BookingStatus.WAITING_FOR_PROFESSIONAL) {
  throw new BadRequestException('Cannot accept this booking');
}

// Solo puede iniciar si está confirmado
if (booking.status !== BookingStatus.CONFIRMED) {
  throw new BadRequestException('Cannot start meeting');
}
```

### Límite de Reuniones Concurrentes

```typescript
// Profesional solo puede tener:
// - 1 reunión ACTIVE
// - 1 reunión WAITING

const professionalActiveMeetings = await this.getProfessionalActiveMeetings(booking.professionalId);

if (professionalActiveMeetings.active >= 1 && professionalActiveMeetings.waiting >= 1) {
  throw new BadRequestException('Professional already has maximum meetings');
}
```

---

## 🗄️ Modelo de Datos

### Booking

```prisma
model Booking {
  id                 String        @id @default(cuid())
  clientId           String
  professionalId     String
  scheduledAt        DateTime
  duration           Int           @default(60)
  price              Decimal
  notes              String?
  status             BookingStatus @default(PENDING_PAYMENT)
  paymentId          String?       @unique

  // Campos Jitsi
  jitsiRoom         String?
  meetingStatus     MeetingStatus @default(PENDING)
  meetingStartTime  DateTime?
  meetingEndTime    DateTime?
  meetingAcceptedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  client       User
  professional ProfessionalProfile
  payment      Payment?
  reviews      Review[]
}
```

### Notification

```typescript
// Creada cuando profesional acepta:
{
  userId: clientId,
  type: 'BOOKING_CONFIRMED',
  title: 'Consulta confirmada',
  message: 'El profesional ha aceptado tu solicitud...',
  payload: {
    bookingId: string,
    professionalName: string,
    jitsiRoom: string,
    canJoinNow: true
  }
}

// Creada cuando pago se aprueba:
{
  userId: professionalUserId,
  type: 'BOOKING_REQUEST',
  title: 'Nueva solicitud de consulta',
  message: 'Tienes una nueva solicitud de consulta pagada...',
  payload: {
    bookingId: string,
    amount: string,
    paymentId: string,
    clientId: string
  }
}
```

---

## 🎨 Responses de los Endpoints

### getWaitingBookings (Profesional)

```json
{
  "bookings": [
    {
      "id": "clxxx123",
      "clientId": "user_456",
      "professionalId": "prof_789",
      "scheduledAt": "2025-10-17T15:00:00.000Z",
      "duration": 60,
      "price": "25000.00",
      "status": "WAITING_FOR_PROFESSIONAL",
      "meetingStatus": "WAITING",
      "jitsiRoom": "prof789-abc123",
      "client": {
        "id": "user_456",
        "name": "Juan Pérez",
        "email": "juan@example.com"
      },
      "payment": {
        "id": "pay_123",
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

### acceptMeeting

```json
{
  "id": "clxxx123",
  "clientId": "user_456",
  "professionalId": "prof_789",
  "status": "CONFIRMED",
  "meetingStatus": "WAITING",
  "meetingAcceptedAt": "2025-10-17T15:00:00.000Z",
  "jitsiRoom": "prof789-abc123",
  "canJoinMeeting": true,
  "message": "Booking confirmed. Both parties can now join the meeting.",
  "client": {
    "id": "user_456",
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

### getClientBookings

```json
{
  "bookings": [...],
  "count": 5,
  "grouped": {
    "pending_payment": [],
    "waiting_acceptance": [
      {
        "id": "clxxx123",
        "status": "WAITING_FOR_PROFESSIONAL",
        "professional": {
          "name": "Dra. María González",
          "specialty": "Psicología"
        }
      }
    ],
    "confirmed": [
      {
        "id": "clyyy456",
        "status": "CONFIRMED",
        "jitsiRoom": "prof789-def456",
        "professional": {
          "name": "Dr. Carlos López"
        }
      }
    ],
    "in_progress": [],
    "completed": [],
    "cancelled": []
  }
}
```

### canUserJoinMeeting

```json
{
  "canJoin": true,
  "jitsiRoom": "prof789-abc123",
  "role": "client",
  "meetingStatus": "WAITING",
  "bookingStatus": "CONFIRMED"
}
```

### startMeeting

```json
{
  "id": "clxxx123",
  "status": "IN_PROGRESS",
  "meetingStatus": "ACTIVE",
  "jitsiRoom": "prof789-abc123",
  "meetingStartTime": "2025-10-17T15:05:00.000Z",
  "meetingEndTime": "2025-10-17T15:23:00.000Z",
  "remainingTime": 1080000,
  "client": {
    "id": "user_456",
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

---

## ⚠️ Casos de Error Comunes

### 1. Profesional intenta aceptar booking incorrecto

```json
{
  "statusCode": 403,
  "message": "Not authorized to accept this meeting"
}
```

### 2. Usuario intenta unirse antes de que profesional acepte

```json
{
  "statusCode": 400,
  "message": "Meeting is not ready to join. Current status: WAITING_FOR_PROFESSIONAL"
}
```

### 3. Profesional ya tiene máximo de reuniones

```json
{
  "statusCode": 400,
  "message": "Professional already has maximum meetings"
}
```

### 4. Usuario no autorizado intenta unirse

```json
{
  "statusCode": 403,
  "message": "Not authorized to join this meeting"
}
```

---

## 🧪 Testing

### Flujo de Testing Manual

1. **Crear booking + pago:**

   ```bash
   POST /api/payments/mp/simple-preference
   Body: {
     clientId, professionalId, scheduledAt, price, etc.
   }
   ```

2. **Simular webhook de pago:**

   ```bash
   POST /api/payments/webhook
   Body: { type: "payment", data: { id: paymentId } }
   ```

3. **Profesional acepta:**

   ```bash
   PATCH /api/bookings/{bookingId}/accept-meeting
   Headers: { Authorization: "Bearer {professionalToken}" }
   ```

4. **Cliente verifica que puede unirse:**

   ```bash
   GET /api/bookings/{bookingId}/join-meeting
   Headers: { Authorization: "Bearer {clientToken}" }
   ```

5. **Cliente inicia reunión:**
   ```bash
   POST /api/bookings/{bookingId}/start-meeting
   Headers: { Authorization: "Bearer {clientToken}" }
   ```

---

## 🚀 Próximas Mejoras

### Corto plazo:

- [ ] WebSockets para notificaciones en tiempo real
- [ ] Emails automáticos cuando profesional acepta
- [ ] Sistema de recordatorios (15 min antes de la consulta)
- [ ] Cancelación de bookings con reembolso

### Mediano plazo:

- [ ] Reagendar consultas
- [ ] Chat dentro de la videollamada
- [ ] Grabación de sesiones (opcional)
- [ ] Sistema de reviews post-consulta

### Largo plazo:

- [ ] Inteligencia artificial para resumen de consultas
- [ ] Análisis de sentimientos en reviews
- [ ] Sistema de calendario integrado (Google Calendar, etc.)

---

## 📝 Notas para el Equipo

1. **Timer de 18 minutos**: Se ejecuta con `setTimeout` en Node.js. Si el servidor se reinicia, el timer se pierde. Considerar usar Redis o un job queue (Bull) para mayor confiabilidad.

2. **JitsiRoom único**: El formato es `{professionalId-últimos8}-{uuid-primeros8}`. Ejemplo: `prof789-abc123de`

3. **Notificaciones**: Actualmente se crean en BD pero no se envían en tiempo real. Frontend debe hacer polling o implementar WebSockets.

4. **Seguridad Jitsi**: Actualmente usa Jitsi público (meet.jit.si). Para producción, considera:
   - Servidor Jitsi propio
   - JWT tokens para salas privadas
   - Moderadores automáticos

5. **Límite de reuniones**: Un profesional solo puede tener 1 activa + 1 en espera. Esto previene sobrecarga.

---

## 🔗 Enlaces Útiles

- [Prisma Schema](./prisma/schema.prisma)
- [Bookings Service](./src/bookings/bookings.service.ts)
- [Bookings Controller](./src/bookings/bookings.controller.ts)
- [Payments Service](./src/payments/payments.service.ts)
- [Guía Frontend](./BOOKING-FLOW-FRONTEND.md)

---

¿Preguntas? Contacta al equipo de backend. 🚀
