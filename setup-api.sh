#!/bin/bash

# Script para configurar el nuevo proyecto API independiente
# Ejecutar desde: profesional-api/

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔧 Configurando proyecto API independiente${NC}"

# Actualizar package.json para eliminar referencias a workspace
echo -e "${YELLOW}📝 Actualizando package.json...${NC}"

# Crear versión actualizada del package.json
cat > package.json.tmp << 'EOF'
{
  "name": "profesional-api",
  "version": "0.1.0",
  "private": true,
  "description": "Backend API for Profesional platform",
  "scripts": {
    "dev": "nest start --watch",
    "build": "prisma generate && nest build",
    "start": "node dist/src/main",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "format": "prettier --write \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@nestjs/axios": "^4.0.1",
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.1.17",
    "@nestjs/terminus": "^10.2.0",
    "@nestjs/throttler": "^5.0.1",
    "@node-rs/bcrypt": "^1.10.7",
    "@prisma/client": "^6.14.0",
    "@profesional/contracts": "^0.1.0",
    "@sentry/node": "^7.92.0",
    "@supabase/supabase-js": "^2.56.0",
    "axios": "^1.11.0",
    "bcryptjs": "^3.0.2",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "nestjs-pino": "^3.5.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "pino": "^8.16.2",
    "posthog-node": "^5.9.2",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "socket.io": "^4.8.1",
    "uuid": "^11.1.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcryptjs": "^3.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/passport-jwt": "^3.0.13",
    "@types/passport-local": "^1.0.38",
    "@types/supertest": "^2.0.12",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "pino-pretty": "^13.1.1",
    "prettier": "^3.0.0",
    "prisma": "^6.14.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.6"
}
EOF

mv package.json.tmp package.json

# Crear .npmrc para GitHub Packages
echo -e "${YELLOW}📦 Configurando acceso a GitHub Packages...${NC}"
cat > .npmrc << 'EOF'
@profesional:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
EOF

# Actualizar tsconfig.json para eliminar referencias a monorepo
echo -e "${YELLOW}⚙️  Actualizando tsconfig.json...${NC}"
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "allowJs": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["./src/*"]
    },
    "incremental": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
EOF

# Actualizar .eslintrc.js
echo -e "${YELLOW}🔍 Configurando ESLint...${NC}"
cat > .eslintrc.js << 'EOF'
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
EOF

# Crear .prettierrc
cat > .prettierrc << 'EOF'
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
EOF

# Actualizar nest-cli.json
echo -e "${YELLOW}🪺 Configurando NestJS...${NC}"
cat > nest-cli.json << 'EOF'
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "assets": ["**/*.proto"],
    "watchAssets": true
  }
}
EOF

echo -e "${GREEN}✅ Configuración completada!${NC}"
echo ""
echo -e "${BLUE}📋 Próximos pasos:${NC}"
echo ""
echo -e "${YELLOW}1. Configurar variables de entorno:${NC}"
echo "   cp .env.example .env"
echo "   # Edita .env con tus credenciales"
echo ""
echo -e "${YELLOW}2. Configurar GitHub Token para instalar @profesional/contracts:${NC}"
echo "   export GITHUB_TOKEN=tu_github_personal_access_token"
echo "   # O agrégalo a tu .env"
echo ""
echo -e "${YELLOW}3. Instalar dependencias:${NC}"
echo "   pnpm install"
echo ""
echo -e "${YELLOW}4. Generar Prisma client:${NC}"
echo "   pnpm prisma:generate"
echo ""
echo -e "${YELLOW}5. Iniciar desarrollo:${NC}"
echo "   pnpm dev"
echo ""
echo -e "${BLUE}📚 Nota importante:${NC}"
echo "Antes de \`pnpm install\`, necesitas publicar @profesional/contracts"
echo "o instalarlo temporalmente copiando la carpeta desde el monorepo."
