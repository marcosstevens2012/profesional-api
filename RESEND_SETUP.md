# Configuración de Resend para Emails

Este proyecto usa [Resend](https://resend.com) para el envío de emails transaccionales (verificación de email, recuperación de contraseña, etc.).

## 🚀 Configuración Rápida

### 1. Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Verifica tu email

### 2. Obtener tu API Key

1. Ve al dashboard de Resend
2. Click en "API Keys" en el menú lateral
3. Click en "Create API Key"
4. Dale un nombre (ej: "Profesional Development")
5. Selecciona permisos: "Sending access"
6. Copia la API key generada

### 3. Configurar en el proyecto

En el archivo `.env`:

```bash
# Resend Email Service
RESEND_API_KEY="re_your_api_key_here"
EMAIL_USE_MOCK=false

# Email
EMAIL_FROM="onboarding@resend.dev"  # En desarrollo, usa este dominio de Resend
BASE_URL="http://localhost:3000"    # URL del frontend
```

### 4. Verificar dominio (Producción)

Para usar tu propio dominio en producción:

1. En Resend dashboard, ve a "Domains"
2. Click en "Add Domain"
3. Ingresa tu dominio (ej: `profesional.com`)
4. Sigue las instrucciones para agregar los registros DNS
5. Una vez verificado, actualiza `EMAIL_FROM` en `.env`:

```bash
EMAIL_FROM="noreply@tudominio.com"
```

## 🧪 Modo de Desarrollo

### Usar emails MOCK (sin Resend)

Si no querés configurar Resend en desarrollo, podés usar el modo mock:

```bash
EMAIL_USE_MOCK=true
RESEND_API_KEY=""  # Dejar vacío
```

Los emails se mostrarán en los logs del servidor en lugar de enviarse.

### Usar Resend con dominio de desarrollo

Para testing real en desarrollo, usá el dominio provisto por Resend:

```bash
EMAIL_USE_MOCK=false
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="onboarding@resend.dev"
```

**Nota**: Con el dominio `resend.dev`, los emails solo se pueden enviar a:

- Emails verificados en tu cuenta de Resend
- Tu propio email de registro

## 📧 Emails Implementados

El sistema envía los siguientes emails:

### 1. Verificación de Email

- **Trigger**: Al registrarse un nuevo usuario
- **Template**: `sendEmailVerification()`
- **Contenido**: Link de verificación válido por 24 horas

### 2. Recuperación de Contraseña

- **Trigger**: Al solicitar reseteo de contraseña
- **Template**: `sendPasswordReset()`
- **Contenido**: Link para restablecer contraseña válido por 1 hora

## 🔧 Personalización de Templates

Los templates HTML de los emails están en:

```
src/common/services/email.service.ts
```

Podés personalizarlos editando los métodos:

- `sendEmailVerification()`
- `sendPasswordReset()`

## 📊 Monitoreo

Para ver los emails enviados:

1. Ve al dashboard de Resend
2. Click en "Emails" en el menú lateral
3. Verás el estado de cada email (entregado, rebotado, etc.)

## 🐛 Troubleshooting

### Error: "API key is invalid"

- Verificá que copiaste la API key completa
- La key debe empezar con `re_`
- No debe tener espacios al inicio o final

### Emails no llegan

- Verificá que `EMAIL_USE_MOCK=false`
- En desarrollo con `resend.dev`, solo se envían a emails verificados
- Revisá los logs del servidor para ver errores
- Verificá la carpeta de spam

### Error: "Domain not verified"

- Si usás un dominio personalizado, verificá que esté correctamente configurado en Resend
- Los registros DNS pueden tardar hasta 48 horas en propagarse

## 💰 Límites del Plan Gratuito

Plan gratuito de Resend:

- ✅ 3,000 emails por mes
- ✅ 100 emails por día
- ✅ 1 dominio verificado
- ✅ API completa

Perfecto para desarrollo y aplicaciones pequeñas.

## 🔗 Links Útiles

- [Documentación de Resend](https://resend.com/docs)
- [Resend Dashboard](https://resend.com/dashboard)
- [Verificación de Dominios](https://resend.com/docs/dashboard/domains/introduction)
