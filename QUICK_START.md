# 🚀 Quick Start - Profesional API

## Requisitos Previos

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL (o acceso a Supabase)
- GitHub Personal Access Token (para instalar @profesional/contracts)

## 1. Configurar GitHub Token

```bash
# Crear token en: https://github.com/settings/tokens
# Permisos necesarios: write:packages, read:packages, repo

# Opción A: Variable de entorno
export GITHUB_TOKEN=ghp_tu_token_aqui

# Opción B: Agregar a ~/.npmrc (permanente)
echo "//npm.pkg.github.com/:_authToken=TU_TOKEN" >> ~/.npmrc
```

## 2. Instalar Dependencias

```bash
pnpm install
```

## 3. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` y configura:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public"

# JWT
JWT_SECRET="tu-secret-super-seguro-cambialo"
JWT_REFRESH_SECRET="otro-secret-super-seguro"

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_KEY="tu-supabase-anon-key"

# CORS
CORS_ORIGINS="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"

# Server
PORT=3001
NODE_ENV=development
```

## 4. Configurar Base de Datos

```bash
# Generar Prisma Client
pnpm prisma:generate

# Sincronizar schema con la base de datos
pnpm prisma:push

# (Opcional) Seed inicial
pnpm prisma:seed
```

## 5. Iniciar el Servidor

```bash
# Modo desarrollo (con hot reload)
pnpm dev

# Modo producción
pnpm build
pnpm start
```

El servidor estará disponible en: **http://localhost:3001**

## 6. Verificar que Funciona

```bash
# Health check
curl http://localhost:3001/health

# Debería responder:
# {"status":"ok","timestamp":"2025-10-07T..."}
```

## 📚 Documentación API

Una vez que el servidor esté corriendo, puedes ver la documentación Swagger en:

**http://localhost:3001/api/docs**

## 🔧 Comandos Útiles

```bash
# Desarrollo
pnpm dev              # Iniciar con hot reload
pnpm build            # Compilar para producción
pnpm start            # Iniciar servidor producción

# Prisma
pnpm prisma:generate  # Generar Prisma Client
pnpm prisma:push      # Sincronizar schema
pnpm prisma:migrate   # Crear migración
pnpm prisma:studio    # Abrir Prisma Studio
pnpm prisma:seed      # Ejecutar seed

# Código
pnpm lint             # Ejecutar ESLint
pnpm format           # Formatear código
pnpm typecheck        # Verificar tipos TypeScript
pnpm test             # Ejecutar tests
```

## 🐛 Troubleshooting

### Error: "Cannot find module '@profesional/contracts'"

```bash
# Verifica que GITHUB_TOKEN está configurado
echo $GITHUB_TOKEN

# Si está vacío, configúralo
export GITHUB_TOKEN=tu_token

# Reinstala
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Error: Prisma Client no generado

```bash
pnpm prisma:generate
```

### Puerto 3001 ya en uso

```bash
# Cambia el puerto en .env
PORT=3002
```

### CORS Errors

Verifica que `CORS_ORIGINS` en `.env` incluye la URL del frontend:
```bash
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
```

## 🚢 Deploy a Railway

1. Crear cuenta en [Railway](https://railway.app)
2. New Project → Deploy from GitHub
3. Seleccionar este repositorio
4. Agregar variables de entorno (ver `.env.example`)
5. Deploy automático

Railway usará el `railway.toml` para la configuración.

## 📁 Estructura del Proyecto

```
profesional-api/
├── src/
│   ├── auth/           # Autenticación y autorización
│   ├── users/          # Gestión de usuarios
│   ├── profiles/       # Perfiles profesionales
│   ├── bookings/       # Sistema de reservas
│   ├── payments/       # Integración de pagos
│   ├── notifications/  # Notificaciones
│   ├── common/         # Utilidades compartidas
│   ├── config/         # Configuración
│   └── main.ts         # Entry point
├── prisma/
│   ├── schema.prisma   # Schema de base de datos
│   └── seed.ts         # Datos iniciales
├── test/               # Tests
└── dist/               # Build output
```

## 🔗 Links Útiles

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Railway Docs](https://docs.railway.app)

## 📞 Soporte

Si encuentras problemas, revisa:
1. Este archivo
2. `.env.example` para variables requeridas
3. Logs del servidor
4. Documentación de NestJS

---

**Happy coding!** 🎉
