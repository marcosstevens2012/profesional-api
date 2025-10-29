# 📋 Guía de Implementación Frontend - Flujo de Bookings

## 🔄 Flujo Completo del Sistema

```
1. Cliente selecciona profesional y horario
   ↓
2. Cliente crea booking (PENDING_PAYMENT) ← createSimplePreference
   ↓
3. Cliente paga en MercadoPago
   ↓
4. Webhook actualiza booking → WAITING_FOR_PROFESSIONAL
   ↓
5. Profesional recibe notificación
   ↓
6. Profesional acepta booking → CONFIRMED ← acceptMeeting
   ↓
7. Cliente recibe notificación (puede unirse)
   ↓
8. Cualquiera se une → IN_PROGRESS ← startMeeting
   ↓
9. Reunión finaliza (18 min) → COMPLETED
```

---

## 🎯 Endpoints Disponibles

### 📌 Para el PROFESIONAL

#### 1. Ver bookings esperando aceptación

```typescript
GET /api/bookings/professional/waiting-bookings
Headers: { Authorization: "Bearer <token>" }

Response:
{
  bookings: [
    {
      id: "clxxx123",
      clientId: "cly456",
      scheduledAt: "2025-10-17T15:00:00Z",
      duration: 60,
      price: "25000.00",
      status: "WAITING_FOR_PROFESSIONAL",
      meetingStatus: "WAITING",
      jitsiRoom: "abc123-def456",
      client: {
        id: "cly456",
        name: "Juan Pérez",
        email: "juan@example.com"
      },
      payment: {
        id: "pay_789",
        amount: "25000.00",
        status: "COMPLETED",
        paidAt: "2025-10-17T14:30:00Z"
      },
      createdAt: "2025-10-17T14:25:00Z",
      updatedAt: "2025-10-17T14:30:00Z"
    }
  ],
  count: 1,
  message: "1 booking(s) waiting for your acceptance"
}
```

#### 2. Aceptar booking

```typescript
PATCH /api/bookings/:bookingId/accept-meeting
Headers: { Authorization: "Bearer <token>" }

Response:
{
  id: "clxxx123",
  status: "CONFIRMED",
  meetingStatus: "WAITING",
  meetingAcceptedAt: "2025-10-17T15:00:00Z",
  canJoinMeeting: true,
  jitsiRoom: "abc123-def456",
  message: "Booking confirmed. Both parties can now join the meeting.",
  client: {
    id: "cly456",
    name: "Juan Pérez",
    email: "juan@example.com"
  }
}
```

#### 3. Ver todas las reuniones pendientes

```typescript
GET /api/bookings/professional/meetings
Headers: { Authorization: "Bearer <token>" }

Response:
{
  meetings: [...],
  count: 3
}
```

---

### 📌 Para el CLIENTE

#### 1. Ver mis bookings

```typescript
GET /api/bookings/client/my-bookings
Headers: { Authorization: "Bearer <token>" }

Response:
{
  bookings: [...],
  count: 5,
  grouped: {
    pending_payment: [...],
    waiting_acceptance: [...],
    confirmed: [...],
    in_progress: [...],
    completed: [...],
    cancelled: [...]
  }
}
```

#### 2. Ver un booking específico

```typescript
GET /api/bookings/:bookingId
Headers: { Authorization: "Bearer <token>" }

Response:
{
  id: "clxxx123",
  status: "CONFIRMED",
  meetingStatus: "WAITING",
  jitsiRoom: "abc123-def456",
  scheduledAt: "2025-10-17T15:00:00Z",
  duration: 60,
  price: "25000.00",
  professional: {
    id: "prof_123",
    name: "Dra. María González",
    email: "maria@example.com"
  },
  payment: {
    id: "pay_789",
    amount: "25000.00",
    status: "COMPLETED"
  }
}
```

---

### 📌 Para AMBOS (Cliente y Profesional)

#### 1. Verificar si puede unirse a la reunión

```typescript
GET /api/bookings/:bookingId/join-meeting
Headers: { Authorization: "Bearer <token>" }

Response:
{
  canJoin: true,
  jitsiRoom: "abc123-def456",
  role: "client", // o "professional"
  meetingStatus: "WAITING",
  bookingStatus: "CONFIRMED"
}

// Error si no puede unirse:
{
  statusCode: 400,
  message: "Meeting is not ready to join. Current status: WAITING_FOR_PROFESSIONAL"
}
```

#### 2. Iniciar la reunión (cuando se une a la videollamada)

```typescript
POST /api/bookings/:bookingId/start-meeting
Headers: { Authorization: "Bearer <token>" }

Response:
{
  id: "clxxx123",
  status: "IN_PROGRESS",
  meetingStatus: "ACTIVE",
  jitsiRoom: "abc123-def456",
  meetingStartTime: "2025-10-17T15:05:00Z",
  meetingEndTime: "2025-10-17T15:23:00Z",
  remainingTime: 1080000, // 18 minutos en ms
  client: {...},
  professional: {...}
}
```

#### 3. Ver estado de la reunión

```typescript
GET /api/bookings/:bookingId/meeting-status
Headers: { Authorization: "Bearer <token>" }

Response:
{
  bookingId: "clxxx123",
  jitsiRoom: "abc123-def456",
  meetingStatus: "ACTIVE",
  meetingStartTime: "2025-10-17T15:05:00Z",
  meetingEndTime: "2025-10-17T15:23:00Z",
  remainingTime: 900000 // tiempo restante en ms
}
```

---

## 🎨 Componentes a Implementar en el Frontend

### 1. **Dashboard del Profesional**

`/profesional/dashboard`

```tsx
// Componentes necesarios:
-(<PendingBookingsList />) - <AcceptBookingButton /> - <ActiveMeetingCard />;
```

**Estados a mostrar:**

- 🟡 Bookings esperando aceptación (badge con número)
- ✅ Bookings confirmados listos para unirse
- 🔴 Reuniones en progreso

**Polling necesario:**

```typescript
// Actualizar cada 10 segundos
useEffect(() => {
  const interval = setInterval(async () => {
    const data = await fetch('/api/bookings/professional/waiting-bookings', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setWaitingBookings(data.bookings);
  }, 10000);

  return () => clearInterval(interval);
}, [token]);
```

---

### 2. **Dashboard del Cliente**

`/cliente/mis-consultas`

```tsx
// Componentes necesarios:
-(<MyBookingsList />) - <BookingStatusBadge /> - <JoinMeetingButton />;
```

**Estados a mostrar:**

- ⏳ Esperando pago
- 🕐 Esperando aceptación del profesional
- ✅ Confirmado - Listo para unirse
- 🎥 En progreso
- ✅ Completado

**Lógica para mostrar botón "Unirse":**

```typescript
function canShowJoinButton(booking) {
  return booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS';
}
```

---

### 3. **Página de Videollamada**

`/videollamada/:bookingId`

```tsx
// Flujo al entrar:
1. Verificar si puede unirse: GET /api/bookings/:id/join-meeting
2. Si puede, iniciar reunión: POST /api/bookings/:id/start-meeting
3. Inicializar Jitsi Meet con el jitsiRoom recibido
4. Mostrar timer con tiempo restante
```

**Ejemplo de componente:**

```tsx
function VideoCallPage({ bookingId }) {
  const [meeting, setMeeting] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);

  useEffect(() => {
    async function initMeeting() {
      // 1. Verificar acceso
      const canJoin = await fetch(`/api/bookings/${bookingId}/join-meeting`);

      if (!canJoin.canJoin) {
        alert('No puedes unirte a esta reunión todavía');
        return;
      }

      // 2. Iniciar reunión
      const started = await fetch(`/api/bookings/${bookingId}/start-meeting`, {
        method: 'POST',
      });

      setMeeting(started);
      setRemainingTime(started.remainingTime);

      // 3. Inicializar Jitsi
      initJitsiMeet(started.jitsiRoom);
    }

    initMeeting();
  }, [bookingId]);

  // Timer countdown
  useEffect(() => {
    if (!remainingTime) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1000) {
          clearInterval(interval);
          // Redirigir cuando termine
          router.push('/consulta-finalizada');
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingTime]);

  return (
    <div>
      <Timer remainingMs={remainingTime} />
      <JitsiMeetComponent roomName={meeting?.jitsiRoom} />
    </div>
  );
}
```

---

### 4. **Componente de Notificaciones**

```tsx
// Escuchar notificaciones en tiempo real
useEffect(() => {
  // Polling cada 5 segundos
  const interval = setInterval(async () => {
    const notifications = await fetch('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const unread = notifications.filter((n) => !n.read);

    // Mostrar toast para nuevas notificaciones
    unread.forEach((notification) => {
      if (notification.type === 'BOOKING_CONFIRMED') {
        toast.success(notification.message, {
          action: {
            label: 'Ver consulta',
            onClick: () => router.push(`/consultas/${notification.payload.bookingId}`),
          },
        });
      }
    });
  }, 5000);

  return () => clearInterval(interval);
}, [token]);
```

---

## 🔐 Estados de Booking

| Estado                     | Descripción        | Quién lo ve          | Acciones disponibles       |
| -------------------------- | ------------------ | -------------------- | -------------------------- |
| `PENDING_PAYMENT`          | Esperando pago     | Cliente              | Pagar                      |
| `WAITING_FOR_PROFESSIONAL` | Pago confirmado    | Profesional, Cliente | Profesional: Aceptar       |
| `CONFIRMED`                | Listo para reunión | Ambos                | Unirse a videollamada      |
| `IN_PROGRESS`              | Reunión activa     | Ambos                | Continuar en llamada       |
| `COMPLETED`                | Terminado          | Ambos                | Ver detalles, dejar review |
| `CANCELLED`                | Cancelado          | Ambos                | Ver motivo                 |

---

## 📱 Ejemplo de Flujo UI Completo

### Para el Profesional:

1. **Recibe notificación** (badge en navbar)
2. **Va a dashboard** → Ve lista de bookings esperando
3. **Click en "Ver detalles"** → Modal con info del cliente y pago
4. **Click en "Aceptar consulta"** → Llamada a `PATCH /accept-meeting`
5. **Éxito** → Booking pasa a "Confirmado"
6. **Puede unirse** → Botón "Iniciar videollamada"
7. **Click en botón** → Redirige a `/videollamada/:id`
8. **Página de videollamada:**
   - Llama a `POST /start-meeting`
   - Inicializa Jitsi Meet
   - Muestra timer de 18 minutos
9. **Timer llega a 0** → Auto-redirige a página de finalización

### Para el Cliente:

1. **Paga la consulta** → MercadoPago
2. **Vuelve a la app** → Ve booking en "Esperando profesional"
3. **Recibe notificación** cuando profesional acepta
4. **Ve botón "Unirse a videollamada"** → Click
5. **Redirige a** `/videollamada/:id`
6. **Mismo flujo de videollamada** que el profesional

---

## 🔔 Sistema de Notificaciones

### Tipos de notificaciones a manejar:

```typescript
// Para el Profesional:
- BOOKING_REQUEST: "Nueva solicitud de consulta pagada"

// Para el Cliente:
- BOOKING_CONFIRMED: "Tu consulta ha sido confirmada"
- BOOKING_CANCELLED: "Tu consulta ha sido cancelada"
```

### Endpoint de notificaciones:

```typescript
GET /api/notifications
Headers: { Authorization: "Bearer <token>" }

Response:
{
  notifications: [
    {
      id: "notif_123",
      userId: "user_456",
      type: "BOOKING_CONFIRMED",
      title: "Consulta confirmada",
      message: "Dra. María González ha aceptado tu solicitud...",
      read: false,
      payload: {
        bookingId: "clxxx123",
        professionalName: "Dra. María González",
        jitsiRoom: "abc123-def456",
        canJoinNow: true
      },
      createdAt: "2025-10-17T15:00:00Z"
    }
  ],
  unreadCount: 1
}
```

---

## ⚙️ Configuración de Jitsi Meet

```typescript
// jitsi-config.ts
export function initJitsiMeet(roomName: string, userName: string) {
  const domain = 'meet.jit.si'; // o tu propio servidor Jitsi

  const options = {
    roomName: roomName,
    width: '100%',
    height: '100%',
    parentNode: document.querySelector('#jitsi-container'),
    userInfo: {
      displayName: userName,
    },
    configOverwrite: {
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      disableDeepLinking: true,
      prejoinPageEnabled: false, // Unirse directamente
      toolbarButtons: [
        'microphone',
        'camera',
        'hangup',
        'chat',
        'settings',
        'raisehand',
        'videoquality',
        'filmstrip',
        'fullscreen',
        'tileview',
      ],
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      DEFAULT_BACKGROUND: '#1a1a1a',
    },
  };

  const api = new JitsiMeetExternalAPI(domain, options);

  // Evento cuando termina la llamada
  api.addListener('readyToClose', () => {
    window.location.href = '/consulta-finalizada';
  });

  return api;
}
```

---

## 🚀 Pasos para Implementar

### Día 1: Dashboard Profesional

- [ ] Crear página `/profesional/dashboard`
- [ ] Implementar `<PendingBookingsList />`
- [ ] Agregar polling para actualizar lista
- [ ] Implementar botón "Aceptar consulta"
- [ ] Probar flujo de aceptación

### Día 2: Dashboard Cliente

- [ ] Crear página `/cliente/mis-consultas`
- [ ] Implementar `<MyBookingsList />`
- [ ] Mostrar estados con badges de colores
- [ ] Agregar botón "Unirse" cuando corresponda

### Día 3: Sistema de Notificaciones

- [ ] Implementar polling de notificaciones
- [ ] Agregar badge en navbar con count
- [ ] Implementar toast/modal para nuevas notificaciones
- [ ] Marcar notificaciones como leídas

### Día 4: Página de Videollamada

- [ ] Crear página `/videollamada/:bookingId`
- [ ] Integrar Jitsi Meet
- [ ] Implementar timer countdown
- [ ] Agregar lógica de inicio/fin automático

### Día 5: Pulir y Testing

- [ ] Probar flujo completo end-to-end
- [ ] Ajustar estilos y UX
- [ ] Manejo de errores
- [ ] Loading states

---

## 📝 Notas Importantes

1. **Timer de 18 minutos**: Es automático en el backend, pero el frontend debe mostrar un countdown visual.

2. **Polling vs WebSockets**: Actualmente usa polling. Si quieres tiempo real, considera implementar WebSockets para notificaciones.

3. **Jitsi Room único**: Cada booking tiene un `jitsiRoom` único generado automáticamente. Nunca lo cambies manualmente.

4. **Estado del booking**: Siempre verifica el estado antes de mostrar acciones. Un booking en `WAITING_FOR_PROFESSIONAL` no debe permitir unirse todavía.

5. **Tokens JWT**: Todos los endpoints requieren autenticación. Asegúrate de enviar el token en cada request.

---

## 🐛 Debugging

Si algo falla, revisa:

1. Estado actual del booking: `GET /api/bookings/:id`
2. Logs del backend en la consola
3. Notificaciones en: `GET /api/notifications`
4. Estado del payment: `GET /api/payments/:paymentId`

---

¿Necesitas ayuda con alguna parte específica? 🚀
