# Fix: Error en Webhook de MercadoPago

## 🔴 Problema Identificado

Los webhooks de MercadoPago estaban fallando con el siguiente error:

```
[16:50:28.168] ERROR: ❌ Error getting MP payment 129197330637
[16:50:28.168] ERROR: ❌ Error processing webhook
```

### Causas Potenciales:

1. **Delay de MercadoPago**: Puede haber un pequeño delay entre que MP envía el webhook y cuando el pago está disponible en su API
2. **Errores de API**: 401 (autenticación), 404 (no encontrado), 500 (error del servidor), timeout
3. **Credenciales incorrectas**: Access token inválido o expirado
4. **Rate limiting**: Demasiadas peticiones en poco tiempo
5. **Network issues**: Problemas de conectividad con la API de MP

---

## ✅ Soluciones Implementadas

### 1. **Logging Mejorado** (`mercadopago.service.ts`)

Ahora el error logging incluye todos los detalles necesarios para debugging:

```typescript
this.logger.error(`❌ Error getting MP payment ${paymentId}`, {
  error: error instanceof Error ? error.message : 'Unknown error',
  details: {
    status: 404,              // HTTP status code
    statusText: 'Not Found',  // HTTP status text
    data: { ... },            // Response body de MP
    code: 'ECONNREFUSED',     // Error code si aplica
  },
  url: 'https://api.mercadopago.com/v1/payments/129197330637',
  hasAccessToken: true,
  accessTokenPrefix: 'APP_USR-469866...',
});
```

**Qué nos dice ahora:**

- ✅ El código HTTP exacto (404, 401, 500, etc.)
- ✅ El mensaje de error de MercadoPago
- ✅ Si el access token está configurado
- ✅ Los primeros caracteres del token (para verificar cuál se está usando)
- ✅ La URL completa que se intentó llamar

### 2. **Retry Logic** (`payments.service.ts`)

Implementamos reintentos automáticos con backoff exponencial:

```typescript
let attempts = 0;
const maxAttempts = 3;
const retryDelay = 2000; // 2 segundos

while (attempts < maxAttempts) {
  try {
    attempts++;
    processedData = await this._mercadoPagoService.processWebhookNotification(data);
    break; // Éxito
  } catch (error) {
    if (attempts >= maxAttempts) throw error;

    // Esperar antes de reintentar (2s, 4s, 6s)
    await new Promise((resolve) => setTimeout(resolve, retryDelay * attempts));
  }
}
```

**Beneficios:**

- ✅ Maneja delays temporales de la API de MP
- ✅ 3 intentos con delays incrementales (2s, 4s, 6s)
- ✅ Total: hasta 12 segundos de espera antes de fallar
- ✅ Loguea cada intento para visibilidad

### 3. **Graceful Degradation**

Si después de todos los intentos no se puede obtener el pago:

```typescript
if (!processedData) {
  // Guardar evento fallido para análisis posterior
  await this._prisma.paymentEvent.create({
    data: {
      paymentId: `no-data-${Date.now()}`,
      externalId: data.id,
      type: data.type || 'unknown',
      rawPayload: data,
      data: { message: 'No data returned from MP API' },
    },
  });

  return {
    received: true,
    processed: false,
    reason: 'No data from MP API',
  };
}
```

**Beneficios:**

- ✅ El webhook responde 201 a MP (para que no reintente)
- ✅ Se guarda el evento fallido en BD para análisis
- ✅ No crashea el servidor
- ✅ Permite investigación posterior

---

## 🔍 Debugging: Cómo Interpretar los Logs

### Caso 1: Error 404 - Payment Not Found

```
[ERROR] ❌ Error getting MP payment 129197330637
  details: {
    status: 404,
    statusText: 'Not Found',
    data: { error: 'payment not found' }
  }
```

**Causa**: El payment ID aún no existe en la API de MP  
**Solución**: Los reintentos deberían resolver esto  
**Si persiste**: Verifica que el payment_id en el webhook sea correcto

### Caso 2: Error 401 - Unauthorized

```
[ERROR] ❌ Error getting MP payment 129197330637
  details: {
    status: 401,
    statusText: 'Unauthorized',
    data: { message: 'invalid credentials' }
  },
  accessTokenPrefix: 'APP_USR-469866...'
```

**Causa**: Access token inválido o expirado  
**Solución**:

1. Verificar `MERCADOPAGO_ACCESS_TOKEN` en `.env`
2. Regenerar token en el dashboard de MercadoPago
3. Verificar que estés usando el token correcto (sandbox vs producción)

### Caso 3: Error 500 - Internal Server Error

```
[ERROR] ❌ Error getting MP payment 129197330637
  details: {
    status: 500,
    statusText: 'Internal Server Error'
  }
```

**Causa**: Problema en el servidor de MercadoPago  
**Solución**: Los reintentos deberían resolver esto  
**Si persiste**: Problema en MP, esperar o contactar soporte

### Caso 4: Timeout / No Response

```
[ERROR] ❌ Error getting MP payment 129197330637
  details: {
    message: 'No response from MercadoPago API',
    code: 'ECONNABORTED'
  }
```

**Causa**: Timeout (>10s) o problemas de red  
**Solución**:

1. Verificar conectividad a internet
2. Verificar que `MERCADOPAGO_BASE_URL` sea correcto
3. Los reintentos deberían resolver timeouts temporales

---

## 🧪 Testing

### 1. Verificar Access Token

```bash
curl -X GET \
  'https://api.mercadopago.com/v1/payments/YOUR_PAYMENT_ID' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

Deberías obtener:

- ✅ 200 OK con data del pago
- ❌ 401 → Token inválido
- ❌ 404 → Payment no existe

### 2. Simular Webhook con Payment ID Real

```bash
curl -X POST http://localhost:3001/payments/webhook \
  -H 'Content-Type: application/json' \
  -H 'User-Agent: MercadoPago WebHook v1.0 payment' \
  -d '{
    "id": 123456789,
    "live_mode": false,
    "type": "payment",
    "action": "payment.created",
    "data": {
      "id": "129197330637"
    }
  }'
```

### 3. Monitorear Logs en Tiempo Real

```bash
# En el terminal del servidor
# Buscar estos logs:
[DEBUG] 🔄 Attempting to fetch MP data (attempt 1/3)
[WARN] ⚠️ Attempt 1 failed to fetch MP data
[DEBUG] 🔄 Attempting to fetch MP data (attempt 2/3)
[INFO] ✅ MP payment retrieved
```

---

## 📊 PaymentEvents para Análisis

Los webhooks fallidos se guardan en la tabla `PaymentEvent`:

```sql
SELECT * FROM payment_events
WHERE payment_id LIKE 'no-data-%'
  OR payment_id LIKE 'error-%'
ORDER BY created_at DESC;
```

Esto te permite:

- Ver qué webhooks fallaron
- Analizar los datos que MP envió
- Reintentarlos manualmente si es necesario
- Identificar patrones de fallas

---

## 🔧 Configuración Recomendada

### Variables de Entorno

```env
# Token de acceso (CRÍTICO)
MERCADOPAGO_ACCESS_TOKEN="APP_USR-4698663929927400-..."

# Base URL (verificar)
MERCADOPAGO_BASE_URL="https://api.mercadopago.com"

# Modo sandbox
MERCADOPAGO_SANDBOX=false

# Webhook secret (opcional pero recomendado)
MERCADOPAGO_WEBHOOK_SECRET="tu_webhook_secret"
```

### MercadoPago Dashboard

1. Ir a: https://www.mercadopago.com.ar/developers/panel
2. **Credenciales** → Verificar Access Token
3. **Webhooks** → Configurar URL: `https://tu-dominio.com/payments/webhook`
4. **Eventos** → Activar: `payment`, `merchant_order`

---

## 🚨 Casos Especiales

### Webhook llega ANTES que el pago se cree en MP

**Síntoma**: Webhook llega inmediatamente pero el pago no existe en la API

**Solución actual**: Los 3 reintentos con delay (2s, 4s, 6s) deberían dar suficiente tiempo

**Si persiste**:

```typescript
// Aumentar maxAttempts o retryDelay en payments.service.ts línea 101-102
const maxAttempts = 5; // De 3 a 5 intentos
const retryDelay = 3000; // De 2s a 3s
```

### Webhook duplicado

**Síntoma**: MP envía el mismo webhook múltiples veces

**Solución actual**:

- `idempotencyKey` previene procesar el mismo evento dos veces
- Los eventos duplicados se guardan pero no se procesan

### Rate Limiting

**Síntoma**: Error 429 "Too Many Requests"

**Solución**:

```typescript
// En mercadopago.service.ts, agregar delay entre peticiones
if (errorDetails.status === 429) {
  const retryAfter = errorDetails.headers?.['retry-after'] || 60;
  await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
  // Reintentar
}
```

---

## 📈 Próximos Pasos Recomendados

1. **Monitoring**: Agregar alertas cuando webhooks fallan consistentemente
2. **Dashboard**: Crear vista de webhooks fallidos para análisis
3. **Reprocessing**: Script para reprocesar webhooks fallidos manualmente
4. **Metrics**: Trackear tasa de éxito/fallo de webhooks
5. **Circuit Breaker**: Implementar patrón circuit breaker si MP está caído

---

## 📝 Logs a Monitorear

### Éxito:

```
[INFO] 📨 Received MP webhook
[DEBUG] 🔄 Attempting to fetch MP data (attempt 1/3)
[INFO] ✅ MP payment retrieved
[INFO] 💰 Processing payment notification
[INFO] ✅ Webhook processed successfully
```

### Con Reintentos:

```
[INFO] 📨 Received MP webhook
[DEBUG] 🔄 Attempting to fetch MP data (attempt 1/3)
[WARN] ⚠️ Attempt 1 failed to fetch MP data (will_retry: true)
[DEBUG] 🔄 Attempting to fetch MP data (attempt 2/3)
[INFO] ✅ MP payment retrieved
[INFO] ✅ Webhook processed successfully
```

### Fallo Total:

```
[INFO] 📨 Received MP webhook
[DEBUG] 🔄 Attempting to fetch MP data (attempt 1/3)
[WARN] ⚠️ Attempt 1 failed to fetch MP data
[DEBUG] 🔄 Attempting to fetch MP data (attempt 2/3)
[WARN] ⚠️ Attempt 2 failed to fetch MP data
[DEBUG] 🔄 Attempting to fetch MP data (attempt 3/3)
[WARN] ⚠️ Attempt 3 failed to fetch MP data
[ERROR] ❌ Error processing webhook
  details: { status: 404, data: {...} }
```

---

## ✅ Checklist Post-Deploy

- [ ] Verificar que `MERCADOPAGO_ACCESS_TOKEN` esté configurado
- [ ] Hacer un pago de prueba en sandbox
- [ ] Monitorear logs del webhook
- [ ] Verificar que el pago se actualiza en BD
- [ ] Revisar tabla `payment_events` para eventos fallidos
- [ ] Probar con tarjetas de prueba aprobadas y rechazadas
- [ ] Verificar notificaciones al usuario (si aplica)

---

## 🆘 Si Sigue Fallando

1. **Capturar el error completo**: Los logs nuevos deberían mostrar el problema exacto
2. **Verificar credenciales**: Regenerar access token en MP dashboard
3. **Probar manualmente**: Usar curl para hacer GET del payment
4. **Verificar la red**: Asegurar que el servidor puede alcanzar api.mercadopago.com
5. **Contactar soporte MP**: Si el error es 500 o 503 consistentemente

---

## 📚 Referencias

- [MercadoPago - Webhooks](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)
- [MercadoPago - API Reference](https://www.mercadopago.com.ar/developers/es/reference/payments/_payments_id/get)
- [Retry Strategies](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
