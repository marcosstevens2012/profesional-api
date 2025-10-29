# Email Service - Resend Integration

## ✅ Implementación Completa

Se ha integrado [Resend](https://resend.com) como servicio de emails transaccionales para la aplicación.

### 🎯 Características

- ✅ Envío de emails de verificación al registrarse
- ✅ Envío de emails de recuperación de contraseña
- ✅ Templates HTML profesionales y responsive
- ✅ Modo MOCK para desarrollo sin API key
- ✅ Soporte para dominios personalizados
- ✅ Logs detallados de éxito/error

### 📦 Instalación

El paquete ya está instalado:

```bash
npm install resend
```

### ⚙️ Configuración

#### Variables de Entorno (.env)

```bash
# Email Configuration
EMAIL_FROM="onboarding@resend.dev"  # Dominio de Resend para desarrollo
BASE_URL="http://localhost:3000"    # URL del frontend

# Resend Service
RESEND_API_KEY=""                   # Tu API key de Resend (dejar vacío para mock)
EMAIL_USE_MOCK=true                 # true = mock, false = Resend real
```

#### Modo de Desarrollo (MOCK)

Por defecto está activado el modo MOCK:

```bash
EMAIL_USE_MOCK=true
RESEND_API_KEY=""
```

Los emails se mostrarán en los logs del servidor:

```
[EmailService] 📧 [MOCK EMAIL] Sending email:
[EmailService]    To: usuario@example.com
[EmailService]    Subject: Verificá tu email - Profesional
[EmailService]    From: onboarding@resend.dev
```

#### Modo de Producción (RESEND)

Para usar Resend real:

1. Obtén tu API key de [Resend Dashboard](https://resend.com/api-keys)
2. Configura las variables:

```bash
EMAIL_USE_MOCK=false
RESEND_API_KEY="re_tu_api_key_aqui"
EMAIL_FROM="onboarding@resend.dev"  # En desarrollo
# EMAIL_FROM="noreply@tudominio.com"  # En producción con dominio verificado
```

### 🧪 Testing

#### 1. Probar modo MOCK

```bash
# Asegurate que .env tenga:
EMAIL_USE_MOCK=true

# Registra un usuario
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "name": "Test User",
    "role": "client"
  }'

# Verifica los logs del servidor - deberías ver el email mockeado
```

#### 2. Probar con Resend real

```bash
# Configura .env:
EMAIL_USE_MOCK=false
RESEND_API_KEY="re_tu_api_key"

# Registra un usuario con TU email (importante!)
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email-real@gmail.com",
    "password": "Password123!",
    "name": "Test User",
    "role": "professional"
  }'

# Revisa tu email - deberías recibir el email de verificación
```

### 📧 Emails Implementados

#### 1. Email de Verificación

**Trigger**: Al registrarse un nuevo usuario

**Método**: `emailService.sendEmailVerification(email, token, role)`

**Contenido**:

- Saludo personalizado según el rol (CLIENT/PROFESSIONAL)
- Botón de verificación con link
- Link de texto como fallback
- Aviso de expiración (24 horas)

**Ejemplo**:

```typescript
await this.emailService.sendEmailVerification(user.email, verificationToken.token, user.role);
```

#### 2. Email de Recuperación de Contraseña

**Trigger**: Al solicitar reseteo de contraseña

**Método**: `emailService.sendPasswordReset(email, token)`

**Contenido**:

- Botón para restablecer contraseña
- Link de texto como fallback
- Aviso de expiración (1 hora)

**Ejemplo**:

```typescript
await this.emailService.sendPasswordReset(user.email, resetToken.token);
```

### 🎨 Templates HTML

Los templates están optimizados para:

- ✅ Desktop
- ✅ Mobile
- ✅ Gmail, Outlook, Apple Mail
- ✅ Modo claro y oscuro

### 📊 Monitoreo

#### Logs del Servidor

Con `EMAIL_USE_MOCK=true`:

```
✅ Resend email service initialized
📧 [MOCK EMAIL] Sending email:
   To: user@example.com
   Subject: Verificá tu email - Profesional
```

Con `EMAIL_USE_MOCK=false`:

```
✅ Resend email service initialized
✅ Email sent successfully via Resend to user@example.com (ID: abc123...)
```

#### Dashboard de Resend

1. Ve a [https://resend.com/emails](https://resend.com/emails)
2. Verás todos los emails enviados con su estado:
   - ✅ Delivered (entregado)
   - ⏳ Queued (en cola)
   - ❌ Bounced (rebotado)
   - 📬 Opened (abierto)

### 🔐 Dominios Verificados

#### Desarrollo

Usa el dominio de Resend:

```bash
EMAIL_FROM="onboarding@resend.dev"
```

**Limitación**: Solo puede enviar a emails verificados en tu cuenta.

#### Producción

1. Verifica tu dominio en Resend
2. Actualiza la variable:

```bash
EMAIL_FROM="noreply@tudominio.com"
```

### 🐛 Troubleshooting

#### "Using MOCK email service"

✅ **Comportamiento esperado** si:

- `EMAIL_USE_MOCK=true`
- `RESEND_API_KEY` está vacío

❌ **Problema** si querés usar Resend real:

- Verifica `EMAIL_USE_MOCK=false`
- Verifica que `RESEND_API_KEY` tenga valor

#### "Error sending email via Resend"

Posibles causas:

1. API key inválida → Verifica en Resend dashboard
2. Email no verificado → Con `resend.dev`, solo a emails verificados
3. Límite de rate → Plan gratuito: 100 emails/día

#### No llega el email

1. Verifica logs del servidor para confirmar envío
2. Revisa spam/promociones
3. Verifica que el email esté verificado (en desarrollo)
4. Revisa Dashboard de Resend

### 📚 Documentación Adicional

Para guía completa de setup, ver: [RESEND_SETUP.md](./RESEND_SETUP.md)

### 🔗 Links Útiles

- [Resend Docs](https://resend.com/docs)
- [Resend Dashboard](https://resend.com/dashboard)
- [Resend API Reference](https://resend.com/docs/api-reference/emails/send-email)
