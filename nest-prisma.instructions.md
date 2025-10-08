---
applyTo: "apps/api/**"
description: Convenciones NestJS/Prisma
---

- Módulos por dominio (auth, users, profiles, search, bookings, payments, chat, reviews, notifications, admin).
- Pipes globales, guards (JWT/roles), Helmet, rate limit, CORS estricto.
- Prisma: migraciones atómicas, soft delete donde aplique, índices p/ búsqueda (trigram), seeders.
- Webhooks MP: firma + idempotencia + persistir PaymentEvent crudo.
