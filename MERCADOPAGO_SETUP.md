# Configuración de Mercado Pago - Sandbox

Este proyecto incluye integración completa con Mercado Pago para Argentina.

## Configuración de Entorno

### Variables Requeridas

```env
# Mercado Pago (Sandbox)
MERCADOPAGO_ACCESS_TOKEN=TEST-your-access-token-here
MERCADOPAGO_PUBLIC_KEY=TEST-your-public-key-here
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret-here
MERCADOPAGO_BASE_URL=https://api.mercadopago.com
MERCADOPAGO_SANDBOX=true

# URLs
FRONTEND_BASE_URL=http://localhost:3000
```

### Obtener Credenciales de Prueba

1. Ir a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
2. Crear una aplicación
3. Copiar las credenciales de prueba:
   - **Access Token**: Comienza con `TEST-`
   - **Public Key**: Comienza con `TEST-`

### Configurar Webhook

1. En el panel de MP, configurar webhook URL: `{BACKEND_URL}/payments/mp/webhook`
2. Eventos a suscribir: `payment`
3. Generar y copiar el **Webhook Secret**

## Flujo de Pagos

### 1. Crear Booking

```http
POST /bookings
{
  "professionalId": "uuid",
  "scheduledAt": "2024-01-15T10:00:00Z",
  "duration": 60,
  "price": 5000,
  "notes": "Consulta inicial"
}
```

### 2. Generar Preferencia de Pago

```http
POST /payments/mp/preference
{
  "bookingId": "uuid",
  "customerId": "uuid",
  "professionalId": "uuid",
  "amount": 5000,
  "description": "Sesión con Dr. Juan Pérez",
  "payerEmail": "cliente@email.com"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=123",
    "payment_id": "uuid"
  }
}
```

### 3. Proceso de Pago

1. Cliente hace clic en `init_point`
2. Completa el pago en MP
3. MP envía webhook a `/payments/mp/webhook`
4. Sistema procesa webhook y actualiza estado
5. Si pago aprobado → Booking pasa a `CONFIRMED`

## Estados de Pago

| MP Status   | Sistema Status | Descripción      |
| ----------- | -------------- | ---------------- |
| `pending`   | `PENDING`      | Pago pendiente   |
| `approved`  | `APPROVED`     | Pago aprobado    |
| `rejected`  | `REJECTED`     | Pago rechazado   |
| `cancelled` | `CANCELLED`    | Pago cancelado   |
| `refunded`  | `REFUNDED`     | Pago reembolsado |

## Comisiones

### Configuración por Defecto

- **Porcentaje**: 10% sobre el monto total
- **Fee fijo**: $0 (configurable)

### Cálculo de Ejemplo

```
Monto sesión: $5000
Comisión plataforma (10%): $500
Neto profesional: $4500
```

### Gestión de Comisiones

```http
# Ver regla activa
GET /admin/commission-rules/active

# Crear nueva regla
POST /admin/commission-rules
{
  "percentage": 12,
  "fixedFee": 100,
  "isActive": true
}
```

## Testing

### Tarjetas de Prueba (Argentina)

| Número                | Marca      | Resultado |
| --------------------- | ---------- | --------- |
| `4509 9535 6623 3704` | Visa       | Aprobada  |
| `5031 7557 3453 0604` | Mastercard | Aprobada  |
| `4013 5406 8274 6260` | Visa       | Rechazada |

### Datos de Prueba

- **Email**: test_user_123456@testuser.com
- **Documento**: 12345678 (DNI)

### Webhook Testing

```bash
# Usar ngrok para testing local
npx ngrok http 3001

# Configurar webhook URL en MP:
https://your-ngrok-url.ngrok.io/payments/mp/webhook
```

## Monitoreo

### Logs de Pagos

```bash
# Ver logs en desarrollo
pnpm dev

# Filtrar logs de pagos
grep "PaymentsService\|MercadoPagoService" logs/app.log
```

### Base de Datos

```sql
-- Pagos recientes
SELECT p.*, b.status as booking_status
FROM payments p
JOIN bookings b ON p.id = b."paymentId"
ORDER BY p."createdAt" DESC;

-- Eventos de webhook
SELECT * FROM payment_events
ORDER BY "processedAt" DESC;
```

## Troubleshooting

### Webhook No Procesa

1. Verificar firma del webhook
2. Revisar logs del servidor
3. Confirmar URL accesible desde internet
4. Validar formato de la respuesta (debe ser 200)

### Pago Aprobado pero Booking No Confirma

1. Verificar mapeo de estados MP → Sistema
2. Revisar `payment_events` para debugging
3. Confirmar `external_reference` coincide con Payment.id

### Errores Comunes

- **401 Unauthorized**: Access token inválido o expirado
- **Webhook 400**: Firma inválida o payload malformado
- **404 Payment**: Payment ID no existe en MP

## Producción

### Cambios Requeridos

1. Usar credenciales de producción (sin TEST-)
2. Configurar `MERCADOPAGO_SANDBOX=false`
3. URLs de webhook deben ser HTTPS válidas
4. Configurar rate limiting más estricto
5. Implementar retry para webhooks fallidos
