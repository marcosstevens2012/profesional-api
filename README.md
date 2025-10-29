# Profesional API

Backend API for the Profesional platform built with NestJS, Prisma, and PostgreSQL.

## 🎉 **NUEVA ACTUALIZACIÓN: Sistema de Bookings con Videollamadas**

✅ **Sistema completo implementado** (Octubre 2025)

- Flujo de bookings end-to-end
- Aceptación de consultas por profesionales
- Videollamadas con Jitsi Meet
- Notificaciones automáticas
- Timer de 18 minutos

📚 **[Ver documentación completa →](./INDEX.md)**

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:push

# Start development server
pnpm dev
```

## 📚 Documentación

### Sistema de Bookings (Nuevo)

- **[INDEX.md](./INDEX.md)** - Índice completo de documentación
- **[RESUMEN-EJECUTIVO.md](./RESUMEN-EJECUTIVO.md)** - Vista general del sistema
- **[BOOKING-FLOW-FRONTEND.md](./BOOKING-FLOW-FRONTEND.md)** - Guía de implementación frontend
- **[BOOKING-BACKEND-SUMMARY.md](./BOOKING-BACKEND-SUMMARY.md)** - Arquitectura backend
- **[HTTP-REQUESTS.md](./HTTP-REQUESTS.md)** - Colección de requests para testing

### Testing

```bash
# Testear flujo completo de bookings
./test-booking-flow.sh
```

## 📦 Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:push` - Push schema changes to database
- `pnpm prisma:seed` - Seed database

## 🏗️ Tech Stack

- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Database
- **Supabase** - Auth & Storage
- **JWT** - Authentication
- **MercadoPago** - Payment gateway
- **Jitsi Meet** - Video calling

## 📝 Environment Variables

See `.env.example` for required environment variables.

## 🚢 Deployment

This API is configured for Railway deployment. See `railway.toml` for configuration.

## 📄 License

Private - Profesional Platform
