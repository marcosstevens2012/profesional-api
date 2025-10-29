# 📚 Índice de Documentación - Sistema de Bookings

## 🎯 Inicio Rápido

**¿No sabes por dónde empezar?** Lee esto primero:

- 👉 **[RESUMEN-EJECUTIVO.md](./RESUMEN-EJECUTIVO.md)** - Vista general del proyecto

---

## 📖 Documentación por Rol

### 👨‍💻 Para Desarrolladores Frontend

1. **[BOOKING-FLOW-FRONTEND.md](./BOOKING-FLOW-FRONTEND.md)** 📗
   - Guía completa de implementación
   - Todos los endpoints explicados
   - Código de ejemplo React/TypeScript
   - Integración con Jitsi Meet
   - Sistema de notificaciones
   - Plan de implementación por días

2. **[HTTP-REQUESTS.md](./HTTP-REQUESTS.md)** 📕
   - Colección de requests para testing
   - Ejemplos de Postman/Thunder Client
   - Variables de entorno
   - Flujo completo de testing

### 🔧 Para Desarrolladores Backend

1. **[BOOKING-BACKEND-SUMMARY.md](./BOOKING-BACKEND-SUMMARY.md)** 📙
   - Resumen técnico completo
   - Estados del sistema
   - Flujo detallado de cada paso
   - Validaciones y seguridad
   - Modelo de datos Prisma
   - Responses de endpoints
   - Casos de error comunes

### 📋 Para Project Managers / Tech Leads

1. **[IMPLEMENTACION-COMPLETA.md](./IMPLEMENTACION-COMPLETA.md)** 📘
   - Resumen de lo implementado
   - Checklist de tareas frontend
   - Estados del sistema
   - Configuración necesaria
   - Estimaciones de tiempo

---

## 🗂️ Documentos por Propósito

### 📝 Empezar

- **[RESUMEN-EJECUTIVO.md](./RESUMEN-EJECUTIVO.md)** - Vista general y estado actual

### 🎨 Implementar Frontend

- **[BOOKING-FLOW-FRONTEND.md](./BOOKING-FLOW-FRONTEND.md)** - Guía paso a paso
- **[HTTP-REQUESTS.md](./HTTP-REQUESTS.md)** - Testing de endpoints

### 🔧 Entender Backend

- **[BOOKING-BACKEND-SUMMARY.md](./BOOKING-BACKEND-SUMMARY.md)** - Arquitectura y lógica

### 📊 Planificar

- **[IMPLEMENTACION-COMPLETA.md](./IMPLEMENTACION-COMPLETA.md)** - Checklist y tiempos

### 🧪 Testear

- **[test-booking-flow.sh](./test-booking-flow.sh)** - Script de testing
- **[HTTP-REQUESTS.md](./HTTP-REQUESTS.md)** - Requests manuales

---

## 🎯 Rutas Rápidas

### "Necesito implementar el dashboard del profesional"

→ **[BOOKING-FLOW-FRONTEND.md](./BOOKING-FLOW-FRONTEND.md)** - Sección "Dashboard del Profesional"

### "Necesito implementar la videollamada"

→ **[BOOKING-FLOW-FRONTEND.md](./BOOKING-FLOW-FRONTEND.md)** - Sección "Página de Videollamada"

### "Necesito testear un endpoint"

→ **[HTTP-REQUESTS.md](./HTTP-REQUESTS.md)** - Busca el endpoint específico

### "No sé qué estados existen"

→ **[BOOKING-BACKEND-SUMMARY.md](./BOOKING-BACKEND-SUMMARY.md)** - Sección "Estados del Sistema"

### "¿Cómo funciona el flujo completo?"

→ **[RESUMEN-EJECUTIVO.md](./RESUMEN-EJECUTIVO.md)** - Diagrama de flujo visual

### "¿Qué falta implementar?"

→ **[IMPLEMENTACION-COMPLETA.md](./IMPLEMENTACION-COMPLETA.md)** - Checklist completo

---

## 📁 Estructura de Archivos del Proyecto

```
profesional-api/
│
├── 📚 DOCUMENTACIÓN
│   ├── RESUMEN-EJECUTIVO.md          ⭐ Empieza aquí
│   ├── IMPLEMENTACION-COMPLETA.md    📋 Checklist y plan
│   ├── BOOKING-FLOW-FRONTEND.md      📗 Guía frontend
│   ├── BOOKING-BACKEND-SUMMARY.md    📙 Arquitectura backend
│   ├── HTTP-REQUESTS.md              📕 Testing de APIs
│   └── INDEX.md                      📚 Este archivo
│
├── 🧪 TESTING
│   └── test-booking-flow.sh          Script de testing
│
├── 💻 CÓDIGO
│   └── src/
│       ├── bookings/
│       │   ├── bookings.controller.ts    ← Endpoints REST
│       │   ├── bookings.service.ts       ← Lógica de negocio
│       │   └── bookings.module.ts
│       ├── payments/
│       │   ├── payments.controller.ts
│       │   ├── payments.service.ts
│       │   └── mercadopago.service.ts
│       └── notifications/
│           ├── notifications.controller.ts
│           └── notifications.service.ts
│
└── 🗄️ DATABASE
    └── prisma/
        └── schema.prisma                 Modelo de datos
```

---

## 🚀 Flujo de Trabajo Recomendado

### Para nuevos desarrolladores:

1. **Lee el resumen**: [RESUMEN-EJECUTIVO.md](./RESUMEN-EJECUTIVO.md)
2. **Entiende el flujo**: Ver diagrama en resumen ejecutivo
3. **Revisa endpoints**: [HTTP-REQUESTS.md](./HTTP-REQUESTS.md)
4. **Prueba la API**: Ejecutar `./test-booking-flow.sh`
5. **Implementa frontend**: Seguir [BOOKING-FLOW-FRONTEND.md](./BOOKING-FLOW-FRONTEND.md)

### Para debugging:

1. **Ver estado del booking**: `GET /api/bookings/:id`
2. **Ver logs**: Terminal del servidor
3. **Ver notificaciones**: `GET /api/notifications`
4. **Ver documentación técnica**: [BOOKING-BACKEND-SUMMARY.md](./BOOKING-BACKEND-SUMMARY.md)

---

## 📊 Estados del Sistema (Referencia Rápida)

### BookingStatus

- `PENDING_PAYMENT` - Esperando pago
- `WAITING_FOR_PROFESSIONAL` - Esperando aceptación
- `CONFIRMED` - Listo para unirse
- `IN_PROGRESS` - Reunión activa
- `COMPLETED` - Finalizado
- `CANCELLED` - Cancelado
- `NO_SHOW` - Cliente no se presentó

### MeetingStatus

- `PENDING` - Antes del pago
- `WAITING` - Esperando profesional
- `ACTIVE` - Reunión en curso
- `COMPLETED` - Finalizado
- `CANCELLED` - Cancelado
- `EXPIRED` - Tiempo agotado

---

## 🎯 Endpoints Principales (Referencia Rápida)

### Profesional

```
GET    /bookings/professional/waiting-bookings
PATCH  /bookings/:id/accept-meeting
GET    /bookings/professional/meetings
```

### Cliente

```
GET    /bookings/client/my-bookings
GET    /bookings/:id
```

### Videollamada (Ambos)

```
GET    /bookings/:id/join-meeting
POST   /bookings/:id/start-meeting
GET    /bookings/:id/meeting-status
```

### Notificaciones

```
GET    /notifications
```

---

## 🔗 Links Útiles

### Documentación Externa:

- [Jitsi Meet API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/)
- [MercadoPago Webhooks](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)
- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com)

### Testing:

- [Tarjetas de prueba MP](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards)

---

## ❓ FAQ Rápido

**Q: ¿El backend está listo?**
A: ✅ Sí, 100% funcional y probado.

**Q: ¿Qué falta implementar?**
A: El frontend. Ver checklist en [IMPLEMENTACION-COMPLETA.md](./IMPLEMENTACION-COMPLETA.md)

**Q: ¿Cómo testeo los endpoints?**
A: Ejecuta `./test-booking-flow.sh` o usa [HTTP-REQUESTS.md](./HTTP-REQUESTS.md)

**Q: ¿Cuánto tiempo toma implementar el frontend?**
A: ~6-7 días de desarrollo. Ver plan en [IMPLEMENTACION-COMPLETA.md](./IMPLEMENTACION-COMPLETA.md)

**Q: ¿Funciona el timer de 18 minutos?**
A: ✅ Sí, es automático en el backend.

**Q: ¿Cómo integro Jitsi?**
A: Ver guía completa en [BOOKING-FLOW-FRONTEND.md](./BOOKING-FLOW-FRONTEND.md) - Sección "Configuración de Jitsi Meet"

---

## 📞 Soporte

¿Preguntas o problemas?

1. Revisa la documentación correspondiente arriba
2. Ejecuta el script de testing: `./test-booking-flow.sh`
3. Verifica el estado del booking: `GET /api/bookings/:id`
4. Revisa los logs del servidor

---

## 🎉 ¡Listo para empezar!

**Siguiente paso sugerido:**

1. Lee [RESUMEN-EJECUTIVO.md](./RESUMEN-EJECUTIVO.md)
2. Prueba los endpoints con [HTTP-REQUESTS.md](./HTTP-REQUESTS.md)
3. Implementa el frontend con [BOOKING-FLOW-FRONTEND.md](./BOOKING-FLOW-FRONTEND.md)

---

_Última actualización: 17 de Octubre, 2025_
