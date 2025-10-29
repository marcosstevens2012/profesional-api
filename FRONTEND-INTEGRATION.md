# Documentación de Integración Frontend

## 🔐 Autenticación

### Login

```typescript
POST /auth/login
Content-Type: application/json

{
  "email": "profesional@example.com",
  "password": "password123"
}

// Respuesta exitosa (200 OK)
{
  "user": {
    "id": "cmgfrv11k000kyy32m0n0s4qt",
    "email": "lic.gonzalez@kinesiologia.com",
    "role": "professional",
    "status": "ACTIVE"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900  // 15 minutos
  }
}
```

### Uso del Token

Todos los endpoints protegidos requieren el header de autorización:

```typescript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

---

## 👤 Endpoints de Perfil

### 1. Obtener mi perfil

```typescript
GET /profiles/me
Authorization: Bearer {token}

// Respuesta (200 OK)
{
  "id": "cmgfrv1qn000vyy321xgoi3md",
  "userId": "cmgfrv11k000kyy32m0n0s4qt",
  "firstName": "Ana",
  "lastName": "González",
  "avatar": null,
  "phone": "+54 11 4567-8903",
  "createdAt": "2025-10-06T23:38:38.351Z",
  "updatedAt": "2025-10-06T23:38:38.351Z",
  "deletedAt": null
}
```

### 2. Actualizar mi perfil

```typescript
PATCH /profiles/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Ana María",
  "lastName": "González López",
  "phone": "+54 11 4567-8904",
  "avatar": "https://example.com/avatar.jpg"
}
```

### 3. Obtener estado activo/inactivo

```typescript
GET /profiles/me/active-status
Authorization: Bearer {token}

// Respuesta
{
  "isActive": true
}
```

### 4. Toggle estado activo

```typescript
PATCH /profiles/me/toggle-active
Authorization: Bearer {token}

// Respuesta
{
  "isActive": false,
  "message": "Profile deactivated successfully"
}
```

---

## 📅 Endpoints de Reuniones (Professional)

### 1. Obtener todas mis reuniones

```typescript
GET /bookings/professional/meetings
Authorization: Bearer {token}

// Respuesta (200 OK)
{
  "meetings": [
    {
      "id": "cmgp6ovv2000414gb0goix501",
      "clientId": "cmgfrv2ak0012yy32xkj49oyx",
      "professionalId": "cmgfrv34k001qyy3254xsznw8",
      "scheduledAt": "2025-10-14T13:43:39.928Z",
      "duration": 60,
      "price": "30000",
      "notes": null,
      "status": "PENDING_PAYMENT",  // PENDING_PAYMENT | CONFIRMED | CANCELLED | COMPLETED
      "cancelledAt": null,
      "cancellationReason": null,
      "paymentId": "cmgp6oxez000514gbee5o40pc",
      "jitsiRoom": "54xsznw8-b211d910",
      "meetingStatus": "PENDING",  // PENDING | ACCEPTED | IN_PROGRESS | COMPLETED | CANCELLED
      "meetingStartTime": null,
      "meetingEndTime": null,
      "meetingAcceptedAt": null,
      "createdAt": "2025-10-13T13:43:40.622Z",
      "updatedAt": "2025-10-13T13:43:42.988Z",
      "client": {
        "id": "cmgfrv2ak0012yy32xkj49oyx",
        "email": "cliente1@email.com",
        "profile": {
          "firstName": "Pedro",
          "lastName": "Gómez"
        }
      }
    }
  ],
  "count": 2
}
```

### 2. Obtener bookings esperando aceptación

```typescript
GET /bookings/professional/waiting-bookings
Authorization: Bearer {token}

// Respuesta (200 OK)
{
  "bookings": [
    {
      "id": "booking123",
      "clientId": "client123",
      "scheduledAt": "2025-10-30T15:00:00.000Z",
      "duration": 60,
      "price": "25000",
      "status": "WAITING_FOR_PROFESSIONAL",
      "client": {
        "email": "client@example.com",
        "profile": {
          "firstName": "Juan",
          "lastName": "Pérez"
        }
      }
    }
  ],
  "count": 1,
  "message": "1 booking(s) waiting for your acceptance"
}
```

### 3. Aceptar una reunión

```typescript
PATCH /bookings/{bookingId}/accept-meeting
Authorization: Bearer {token}

// Respuesta (200 OK)
{
  "id": "booking123",
  "meetingStatus": "ACCEPTED",
  "meetingAcceptedAt": "2025-10-29T12:00:00.000Z",
  "message": "Meeting accepted successfully"
}
```

### 4. Iniciar una reunión (generar link Jitsi)

```typescript
POST /bookings/{bookingId}/start-meeting
Authorization: Bearer {token}

// Respuesta (200 OK)
{
  "id": "booking123",
  "jitsiRoom": "54xsznw8-b211d910",
  "meetingStatus": "IN_PROGRESS",
  "meetingStartTime": "2025-10-29T12:00:00.000Z",
  "meetingUrl": "https://meet.jit.si/54xsznw8-b211d910"
}
```

### 5. Obtener link para unirse a reunión

```typescript
GET /bookings/{bookingId}/join-meeting
Authorization: Bearer {token}

// Respuesta (200 OK)
{
  "jitsiRoom": "54xsznw8-b211d910",
  "meetingUrl": "https://meet.jit.si/54xsznw8-b211d910",
  "bookingId": "booking123",
  "meetingStatus": "IN_PROGRESS"
}
```

### 6. Obtener estado de la reunión

```typescript
GET /bookings/{bookingId}/meeting-status
Authorization: Bearer {token}

// Respuesta (200 OK)
{
  "bookingId": "booking123",
  "meetingStatus": "IN_PROGRESS",
  "meetingStartTime": "2025-10-29T12:00:00.000Z",
  "meetingEndTime": null,
  "meetingAcceptedAt": "2025-10-29T11:55:00.000Z",
  "jitsiRoom": "54xsznw8-b211d910"
}
```

---

## 📋 Estados de Booking

### Booking Status

- `PENDING_PAYMENT` - Esperando pago del cliente
- `CONFIRMED` - Pago confirmado, esperando día de la reunión
- `CANCELLED` - Cancelado
- `COMPLETED` - Finalizado

### Meeting Status

- `PENDING` - Creado, esperando aceptación del profesional
- `ACCEPTED` - Aceptado por el profesional
- `IN_PROGRESS` - Reunión en curso
- `COMPLETED` - Reunión finalizada
- `CANCELLED` - Cancelado

---

## 🎨 Ejemplo de Implementación React

### Service Layer

```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Auth Service

```typescript
// src/services/auth.service.ts
import api from './api';

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    const { tokens, user } = response.data;

    // Guardar tokens
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return { tokens, user };
  },

  async logout() {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },
};
```

### Profile Service

```typescript
// src/services/profile.service.ts
import api from './api';

export const profileService = {
  async getMyProfile() {
    const response = await api.get('/profiles/me');
    return response.data;
  },

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  }) {
    const response = await api.patch('/profiles/me', data);
    return response.data;
  },

  async toggleActiveStatus() {
    const response = await api.patch('/profiles/me/toggle-active');
    return response.data;
  },

  async getActiveStatus() {
    const response = await api.get('/profiles/me/active-status');
    return response.data;
  },
};
```

### Bookings Service

```typescript
// src/services/bookings.service.ts
import api from './api';

export const bookingsService = {
  async getMeetings() {
    const response = await api.get('/bookings/professional/meetings');
    return response.data;
  },

  async getWaitingBookings() {
    const response = await api.get('/bookings/professional/waiting-bookings');
    return response.data;
  },

  async acceptMeeting(bookingId: string) {
    const response = await api.patch(`/bookings/${bookingId}/accept-meeting`);
    return response.data;
  },

  async startMeeting(bookingId: string) {
    const response = await api.post(`/bookings/${bookingId}/start-meeting`);
    return response.data;
  },

  async joinMeeting(bookingId: string) {
    const response = await api.get(`/bookings/${bookingId}/join-meeting`);
    return response.data;
  },

  async getMeetingStatus(bookingId: string) {
    const response = await api.get(`/bookings/${bookingId}/meeting-status`);
    return response.data;
  },
};
```

### React Hook Example

```typescript
// src/hooks/useMeetings.ts
import { useState, useEffect } from 'react';
import { bookingsService } from '../services/bookings.service';

export const useMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [waitingBookings, setWaitingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const [meetingsData, waitingData] = await Promise.all([
        bookingsService.getMeetings(),
        bookingsService.getWaitingBookings(),
      ]);

      setMeetings(meetingsData.meetings);
      setWaitingBookings(waitingData.bookings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptMeeting = async (bookingId: string) => {
    try {
      await bookingsService.acceptMeeting(bookingId);
      await loadMeetings(); // Recargar
    } catch (err) {
      setError(err.message);
    }
  };

  const startMeeting = async (bookingId: string) => {
    try {
      const data = await bookingsService.startMeeting(bookingId);
      // Abrir Jitsi en nueva ventana
      window.open(data.meetingUrl, '_blank');
      await loadMeetings();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  return {
    meetings,
    waitingBookings,
    loading,
    error,
    acceptMeeting,
    startMeeting,
    refresh: loadMeetings,
  };
};
```

### Component Example

```typescript
// src/components/ProfessionalDashboard.tsx
import React from 'react';
import { useMeetings } from '../hooks/useMeetings';

export const ProfessionalDashboard: React.FC = () => {
  const { meetings, waitingBookings, loading, acceptMeeting, startMeeting } = useMeetings();

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h2>Bookings Esperando Aceptación ({waitingBookings.length})</h2>
      {waitingBookings.map(booking => (
        <div key={booking.id}>
          <p>Cliente: {booking.client.profile.firstName} {booking.client.profile.lastName}</p>
          <p>Fecha: {new Date(booking.scheduledAt).toLocaleString()}</p>
          <p>Precio: ${booking.price}</p>
          <button onClick={() => acceptMeeting(booking.id)}>
            Aceptar Reunión
          </button>
        </div>
      ))}

      <h2>Mis Reuniones ({meetings.length})</h2>
      {meetings.map(meeting => (
        <div key={meeting.id}>
          <p>Cliente: {meeting.client.profile.firstName} {meeting.client.profile.lastName}</p>
          <p>Fecha: {new Date(meeting.scheduledAt).toLocaleString()}</p>
          <p>Estado: {meeting.meetingStatus}</p>

          {meeting.meetingStatus === 'ACCEPTED' && (
            <button onClick={() => startMeeting(meeting.id)}>
              Iniciar Reunión
            </button>
          )}

          {meeting.meetingStatus === 'IN_PROGRESS' && (
            <button onClick={() => window.open(`https://meet.jit.si/${meeting.jitsiRoom}`, '_blank')}>
              Unirse a Reunión
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## 🔄 Manejo de Errores

### Formato de Error Estándar

```typescript
{
  "success": false,
  "statusCode": 401,
  "timestamp": "2025-10-29T11:21:05.337Z",
  "path": "/auth/login",
  "method": "POST",
  "message": "Credenciales inválidas",
  "requestId": "e0d5fe56-335b-4a58-92d5-affbff0cdfb3"
}
```

### Códigos de Error Comunes

- `400` - Bad Request (datos inválidos)
- `401` - Unauthorized (no autenticado o token inválido)
- `403` - Forbidden (sin permisos)
- `404` - Not Found (recurso no encontrado)
- `500` - Internal Server Error

### Interceptor de Errores

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado - redirect a login
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
```

---

## 🌐 URLs de Entorno

```typescript
// .env.development
REACT_APP_API_URL=http://localhost:3001

// .env.production
REACT_APP_API_URL=https://profesional-api-production.up.railway.app
```

---

## ✅ Checklist de Integración

- [ ] Configurar axios con baseURL
- [ ] Implementar auth service (login, logout)
- [ ] Agregar interceptor para tokens
- [ ] Implementar profile service
- [ ] Implementar bookings service
- [ ] Crear hook useMeetings
- [ ] Crear componente Dashboard
- [ ] Manejar estados de loading
- [ ] Manejar errores (401, 404, 500)
- [ ] Implementar refresh de datos
- [ ] Configurar CORS en producción
- [ ] Testear flujo completo

---

## 📞 Soporte

- **API Base URL (Dev)**: `http://localhost:3001`
- **API Base URL (Prod)**: `https://profesional-api-production.up.railway.app`
- **Swagger Docs**: `http://localhost:3001/api-docs`
