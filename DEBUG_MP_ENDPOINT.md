# Endpoint de Debug: Consultar MercadoPago Directamente

## 📍 Nuevo Endpoint Creado

```
GET /payments/debug/mp/:paymentId
```

**🔓 Público** (no requiere autenticación)

---

## 🎯 Propósito

Este endpoint consulta el estado de un pago **directamente en la API de MercadoPago**, sin pasar por nuestra base de datos. Es ideal para:

✅ **Debugging de webhooks** - Ver el estado real en MP  
✅ **Troubleshooting** - Comparar datos entre MP y nuestra BD  
✅ **Testing de conectividad** - Verificar que podemos comunicarnos con MP  
✅ **Verificación rápida** - Sin depender de datos locales

---

## 📥 Uso

### Con curl:

```bash
curl http://localhost:3001/payments/debug/mp/129198544875
```

### Con el navegador:

```
http://localhost:3001/payments/debug/mp/129198544875
```

### Con tu script:

```bash
./test-mp-connection.sh 129198544875
```

---

## 📤 Respuesta Exitosa (200)

```json
{
  "success": true,
  "source": "mercadopago_api",
  "timestamp": "2025-10-13T17:00:00.000Z",
  "data": {
    "id": 129198544875,
    "status": "approved",
    "status_detail": "accredited",
    "transaction_amount": 45000,
    "currency_id": "ARS",
    "external_reference": "cmgpdrnn5000312f8fhwvunlh",
    "date_created": "2025-10-13T13:02:01.000-04:00",
    "date_approved": "2025-10-13T13:02:01.000-04:00",
    "payer": {
      "email": "test_user_559...@testuser.com",
      "identification": {
        "type": "DNI",
        "number": "1111111"
      }
    },
    "payment_method": {
      "id": "master",
      "type": "credit_card"
    },
    "transaction_details": {
      "net_received_amount": 43155,
      "total_paid_amount": 45000,
      "installment_amount": 45000
    },
    "charges_details": [...],
    "card": {...},
    // ... más campos de MercadoPago
  },
  "summary": {
    "id": 129198544875,
    "status": "approved",
    "status_detail": "accredited",
    "transaction_amount": 45000,
    "currency_id": "ARS",
    "external_reference": "cmgpdrnn5000312f8fhwvunlh",
    "date_created": "2025-10-13T13:02:01.000-04:00",
    "date_approved": "2025-10-13T13:02:01.000-04:00",
    "payer_email": "test_user_559...@testuser.com",
    "payment_method_id": "master"
  }
}
```

### Campos del Summary:

- `id`: ID del pago en MercadoPago
- `status`: Estado del pago (`approved`, `pending`, `rejected`, etc.)
- `status_detail`: Detalle del estado (`accredited`, `pending_contingency`, etc.)
- `transaction_amount`: Monto total del pago
- `currency_id`: Moneda (`ARS`, `BRL`, etc.)
- `external_reference`: Tu booking ID
- `date_created`: Fecha de creación
- `date_approved`: Fecha de aprobación (si aplica)
- `payer_email`: Email del pagador
- `payment_method_id`: Método de pago usado

---

## ❌ Respuestas de Error

### 404 - Payment Not Found

```json
{
  "success": false,
  "source": "mercadopago_api",
  "timestamp": "2025-10-13T17:00:00.000Z",
  "error": {
    "status": 404,
    "statusText": "Not Found",
    "message": "payment not found",
    "data": {
      "message": "payment not found",
      "error": "not_found",
      "status": 404
    }
  },
  "paymentId": "129198544875"
}
```

**Causa**: El payment ID no existe en MercadoPago

### 401 - Unauthorized

```json
{
  "success": false,
  "source": "mercadopago_api",
  "timestamp": "2025-10-13T17:00:00.000Z",
  "error": {
    "status": 401,
    "statusText": "Unauthorized",
    "message": "invalid credentials",
    "data": {
      "message": "invalid credentials",
      "error": "unauthorized",
      "status": 401
    }
  },
  "paymentId": "129198544875"
}
```

**Causa**: Access token inválido o expirado en `.env`

### 500 - Internal Server Error

```json
{
  "success": false,
  "source": "mercadopago_api",
  "timestamp": "2025-10-13T17:00:00.000Z",
  "error": {
    "status": 500,
    "statusText": "Internal Server Error",
    "message": "Internal server error"
  },
  "paymentId": "129198544875"
}
```

**Causa**: Problema en los servidores de MercadoPago

---

## 🆚 Comparación con Otros Endpoints

| Endpoint                            | Fuente de Datos     | Requiere Auth | Uso Principal         |
| ----------------------------------- | ------------------- | ------------- | --------------------- |
| `GET /payments/debug/mp/:id`        | **MercadoPago API** | ❌ No         | Debugging/Testing     |
| `GET /payments/payment/:id`         | **Base de Datos**   | ❌ No         | App normal            |
| `GET /payments/status?payment_id=X` | **Base de Datos**   | ❌ No         | Páginas de retorno MP |

---

## 🧪 Casos de Uso

### 1. Verificar Estado Real en MP Durante Webhook Debugging

Cuando un webhook falla, usa este endpoint para verificar que el pago existe en MP:

```bash
# El webhook dice payment_id=129198544875 pero falla
curl http://localhost:3001/payments/debug/mp/129198544875

# Si responde 200: El pago existe, el problema está en nuestro código
# Si responde 404: El pago no existe aún en MP (delay)
# Si responde 401: Problema con access token
```

### 2. Comparar Datos Entre MP y Nuestra BD

```bash
# 1. Obtener datos de MercadoPago
curl http://localhost:3001/payments/debug/mp/129198544875 > mp_data.json

# 2. Obtener datos de nuestra BD
curl http://localhost:3001/payments/payment/129198544875 > db_data.json

# 3. Comparar
diff mp_data.json db_data.json
```

### 3. Testing de Conectividad

```bash
# Verificar que podemos conectar con MP API
curl http://localhost:3001/payments/debug/mp/129198544875

# Si falla: Problema de red o credenciales
# Si funciona: La API de MP está accesible
```

### 4. Investigar Payment ID del Webhook

Cuando recibes un webhook con `data.id`, verifica inmediatamente:

```bash
# Del webhook: data.id = 129198544875
curl http://localhost:3001/payments/debug/mp/129198544875 | jq '.summary'

# Ver status real:
# "status": "approved" → Pago exitoso
# "status": "pending" → Pago pendiente
# "status": "rejected" → Pago rechazado
```

---

## 🔧 Configuración Requerida

El endpoint usa las mismas credenciales del `.env`:

```env
MERCADOPAGO_ACCESS_TOKEN="APP_USR-4698663929927400-..."
MERCADOPAGO_BASE_URL="https://api.mercadopago.com"
```

---

## 📊 Logs

El endpoint genera logs detallados:

```
[INFO] 🔍 [DEBUG] Fetching payment 129198544875 directly from MercadoPago API
[INFO] ✅ MP payment retrieved
[DEBUG] Payment data: { id: 129198544875, status: 'approved', ... }
```

O en caso de error:

```
[ERROR] ❌ [DEBUG] Error fetching from MercadoPago: 129198544875
[ERROR] Error details: { status: 404, message: 'payment not found' }
```

---

## ⚠️ IMPORTANTE: Reinicio del Servidor

**Este endpoint requiere reiniciar el servidor para que se registre correctamente.**

```bash
# Detener el servidor (Ctrl+C en el terminal donde corre)
# Luego reiniciar:
npm run start:dev
```

O si estás usando otro comando:

```bash
nest start --watch
```

---

## 🧪 Testing Post-Reinicio

Después de reiniciar el servidor:

```bash
# 1. Verificar que el servidor está up
curl http://localhost:3001

# 2. Probar el endpoint de debug
curl http://localhost:3001/payments/debug/mp/129198544875

# 3. Verificar el summary
curl http://localhost:3001/payments/debug/mp/129198544875 | jq '.summary'
```

Deberías ver:

```json
{
  "id": 129198544875,
  "status": "approved",
  "transaction_amount": 45000,
  ...
}
```

---

## 🔍 Swagger Documentation

Después de reiniciar, también estará disponible en Swagger UI:

1. Ir a: `http://localhost:3001/api`
2. Buscar: **PaymentsController**
3. Endpoint: `GET /payments/debug/mp/{paymentId}`
4. Marcar como: `[DEBUG]`
5. Click en "Try it out"
6. Ingresar payment ID: `129198544875`
7. Click en "Execute"

---

## 📝 Notas Técnicas

- **Rate Limiting**: MP tiene rate limits, no abuses de este endpoint
- **Caching**: No se hace cache, siempre consulta en tiempo real
- **Timeout**: 10 segundos por petición
- **Retry**: No hace reintentos automáticos (es para debugging)
- **Logging**: Todos los errores se loguean con detalles completos

---

## 🚀 Próximos Pasos

1. **Reiniciar el servidor** (para que el endpoint se registre)
2. **Probar con el payment ID del webhook fallido**
3. **Comparar response con lo que espera el webhook handler**
4. **Usar para debugging futuro**

---

## ❓ FAQ

**Q: ¿Por qué no funciona después de agregarlo?**  
A: Necesitas reiniciar el servidor. NestJS no siempre recarga rutas nuevas automáticamente.

**Q: ¿Es seguro dejarlo en producción?**  
A: Sí, es público pero solo lee datos. No modifica nada. Aunque podrías agregar autenticación si prefieres.

**Q: ¿Por qué usar esto y no el script `test-mp-connection.sh`?**  
A: El script usa curl directamente. Este endpoint usa el mismo código que el webhook, entonces debuggeas el flujo completo.

**Q: ¿Puedo usar este endpoint en el frontend?**  
A: Sí, es público. Pero recuerda que expondrías payment IDs. Mejor usalo solo para admin/debugging.

---

## ✅ Checklist

- [ ] Código agregado al controller
- [ ] Servidor reiniciado
- [ ] Endpoint probado con curl
- [ ] Response verificada
- [ ] Logs revisados
- [ ] Swagger actualizado
- [ ] Listo para usar en debugging

---

🎉 ¡Endpoint listo! Solo necesitas **reiniciar el servidor** y estará funcionando.
