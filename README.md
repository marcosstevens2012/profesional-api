# Profesional API

Backend API for the Profesional platform built with NestJS, Prisma, and PostgreSQL.

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
- **Socket.io** - Real-time communication

## 📝 Environment Variables

See `.env.example` for required environment variables.

## 🚢 Deployment

This API is configured for Railway deployment. See `railway.toml` for configuration.

## 📄 License

Private - Profesional Platform
