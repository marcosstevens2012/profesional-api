# Debug: Login Error 500

## Problema Identificado

El error 500 en `/auth/login` no estaba mostrando detalles del error real porque:

1. El `HttpExceptionFilter` no estaba logueando suficientes detalles de excepciones no controladas
2. El método `login` no tenía manejo de errores explícito
3. El método `generateTokens` podría fallar silenciosamente sin logs detallados

## Cambios Realizados

### 1. Mejoras en `HttpExceptionFilter`

**Archivo:** `src/common/filters/http-exception.filter.ts`

- ✅ Agregado tipo `RequestWithId` para evitar usar `any`
- ✅ Mejorado el logging de errores con estructura detallada
- ✅ Agregado log adicional para excepciones no HTTP con detalles completos
- ✅ Extracción de información del error (name, message, stack)

**Antes:**

```typescript
this.logger.error(`${request.method} ${request.url} - ${status}`, {
  requestId,
  status,
  method: request.method,
  url: request.url,
  userAgent: request.get('User-Agent'),
  ip: request.ip,
  error: exception instanceof Error ? exception.stack : exception,
});
```

**Ahora:**

```typescript
// Log con estructura más detallada
this.logger.error(`${request.method} ${request.url} - ${status}`, {
  req: { requestId, method, url, userAgent, ip },
  context: HttpExceptionFilter.name,
  errorDetails: { name, message, stack },
});

// Log adicional para errores no HTTP
if (!(exception instanceof HttpException)) {
  this.logger.error('Unhandled exception details:', exception);
}
```

### 2. Mejoras en `AuthService.login()`

**Archivo:** `src/auth/auth.service.ts`

- ✅ Agregado `Logger` a la clase
- ✅ Wrapped en try-catch para capturar errores inesperados
- ✅ Agregados logs en cada paso del proceso de login
- ✅ Logging específico para cada tipo de fallo de autenticación

**Logs agregados:**

- `Login attempt for email: {email}`
- `Login failed: User not found or deleted`
- `Login failed: Invalid password`
- `Login failed: User suspended`
- `Login failed: Email not verified`
- `Generating tokens for user: {userId}`
- `Login successful for user: {userId}`
- `Unexpected error during login: {error}`

### 3. Mejoras en `generateTokens()`

**Archivo:** `src/auth/auth.service.ts`

- ✅ Agregado try-catch para capturar errores en generación de tokens
- ✅ Validación de configuración JWT antes de generar tokens
- ✅ Logs antes y después de generar tokens
- ✅ Manejo específico de errores de configuración

**Validaciones agregadas:**

```typescript
if (!this.jwtConfig.secret || !this.jwtConfig.refreshSecret) {
  this.logger.error('JWT secrets are not configured properly');
  throw new InternalServerErrorException('Error de configuración del servidor');
}
```

## Posibles Causas del Error 500

Ahora con los logs mejorados, podrás ver exactamente dónde está fallando:

### 1. **Error de Base de Datos**

- Problema de conexión con Prisma
- Campo faltante en la tabla User o Profile
- Constraint violation

**Qué buscar en logs:**

```
Error generating tokens: PrismaClientKnownRequestError...
```

### 2. **Error de Configuración JWT**

- `JWT_SECRET` o `JWT_REFRESH_SECRET` no configurados
- Secrets muy cortos (< 32 caracteres)

**Qué buscar en logs:**

```
JWT secrets are not configured properly
```

### 3. **Error en bcrypt**

- Password hash corrupto en la base de datos
- Problema con la librería @node-rs/bcrypt

**Qué buscar en logs:**

```
Unexpected error during login: Error: ...bcrypt...
```

### 4. **Error en JwtService**

- Problema al firmar tokens
- Configuración inválida de expiración

**Qué buscar en logs:**

```
Error generating tokens: Error: ...jwt...
```

## Cómo Debuguear

### Paso 1: Intentar login nuevamente

```bash
curl -X POST https://your-api.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Paso 2: Revisar los logs

Ahora verás logs mucho más detallados:

```
[INFO] Login attempt for email: test@example.com
[INFO] Generating tokens for user: 123
[ERROR] Unexpected error during login: { errorDetails: {...} }
[ERROR] Unhandled exception details: [Full exception object]
```

### Paso 3: Verificar configuración

**Verificar variables de entorno en Railway:**

```bash
# Debe tener al menos 32 caracteres
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_REFRESH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Verificar base de datos:**

```sql
-- Verificar que el usuario existe
SELECT id, email, status, role FROM "User" WHERE email = 'test@example.com';

-- Verificar que tiene profile
SELECT * FROM "Profile" WHERE "userId" = 'user-id-from-above';

-- Verificar schema de RefreshToken
\d "RefreshToken"
```

## Comandos Útiles

### Ver logs en Railway

```bash
railway logs
```

### Ejecutar migraciones

```bash
railway run npx prisma migrate deploy
```

### Verificar variables de entorno

```bash
railway variables
```

## Próximos Pasos

1. **Esperar al próximo error** y revisar los nuevos logs detallados
2. **Identificar la causa exacta** con la información del stack trace
3. **Aplicar fix específico** basado en el error encontrado

## Mejoras Adicionales Recomendadas

- [ ] Agregar Sentry o similar para tracking de errores
- [ ] Implementar circuit breaker para servicios externos
- [ ] Agregar health checks para dependencias (DB, JWT config)
- [ ] Implementar rate limiting más estricto en login
- [ ] Agregar métricas de performance

---

**Autor:** GitHub Copilot  
**Fecha:** 2025-01-14  
**Archivos modificados:**

- `src/common/filters/http-exception.filter.ts`
- `src/auth/auth.service.ts`
