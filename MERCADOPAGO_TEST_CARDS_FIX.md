# 🔧 Fix para Tarjetas de Prueba de MercadoPago

## Problema

Al intentar usar tarjetas de prueba de MercadoPago en modo sandbox, aparece un mensaje que dice que no se puede procesar el pago con esa tarjeta.

## Tarjetas de Prueba Oficiales (Argentina)

### ✅ Tarjetas que APRUEBAN el pago:

```
Mastercard: 5031 7557 3453 0604
CVV: 123
Fecha: Cualquier fecha futura
Nombre: APRO (o cualquier nombre)

Visa: 4509 9535 6623 3704
CVV: 123
Fecha: Cualquier fecha futura
Nombre: APRO
```

### ❌ Tarjetas que RECHAZAN el pago:

```
Visa: 4774 4612 9001 0078
CVV: 123
Fecha: Cualquier fecha futura
Nombre: cualquier nombre
```

### ⏸️ Tarjetas que quedan PENDIENTES:

```
Mastercard: 5031 4332 1540 6351
CVV: 123
Fecha: Cualquier fecha futura
Nombre: cualquier nombre
```

## Soluciones Implementadas

### 1. Agregar información del `payer` (Pagador)

MercadoPago en sandbox requiere información básica del pagador para procesar correctamente:

```typescript
payer: {
  email: request.payerEmail || 'test_user@test.com',
  name: 'Test',
  surname: 'User',
}
```

### 2. Configurar `payment_methods` correctamente

No excluir todos los métodos, solo configurar límites razonables:

```typescript
payment_methods: {
  installments: 12,
  default_installments: 1,
  // NO excluir métodos en sandbox
}
```

### 3. Agregar `statement_descriptor`

Descripción que aparece en el extracto bancario (máximo 11 caracteres):

```typescript
statement_descriptor: 'PROFESIONAL';
```

### 4. Para Marketplace: Validar split_payments

Si usas marketplace con split payments, asegúrate de:

- El `collector.id` sea el User ID de MercadoPago del profesional (número)
- El `marketplace_fee` sea correcto
- La suma de `amount` + `fee_amount` sea consistente

## Configuración de Variables de Entorno

Verifica que tu `.env` tenga:

```bash
# MercadoPago Sandbox
MERCADOPAGO_ACCESS_TOKEN="TEST-4007194578075950-121117-4f210ee7dff368d36bc6c5f1282273d8-188286210"
MERCADOPAGO_PUBLIC_KEY="TEST-abb3838e-1ccd-4718-896d-bb4232e9aba2"
MERCADOPAGO_SANDBOX=true
MERCADOPAGO_BASE_URL="https://api.mercadopago.com"

# IMPORTANTE: En desarrollo con localhost
FRONTEND_BASE_URL="http://localhost:3000"
# En producción
# FRONTEND_BASE_URL="https://tu-dominio.com"
```

## URLs de Retorno (back_urls)

⚠️ **IMPORTANTE**: MercadoPago NO acepta `localhost` en `back_urls` cuando usas `auto_return: 'approved'`

### Para desarrollo (localhost):

```typescript
back_urls: {
  success: `http://localhost:3000/profesionales/${slug}/pago/exito`,
  failure: `http://localhost:3000/profesionales/${slug}/pago/error`,
  pending: `http://localhost:3000/profesionales/${slug}/pago/pendiente`,
},
// NO agregar auto_return en localhost
```

El usuario deberá hacer clic en "Volver al sitio" después del pago.

### Para producción:

```typescript
back_urls: {
  success: `https://tu-dominio.com/profesionales/${slug}/pago/exito`,
  failure: `https://tu-dominio.com/profesionales/${slug}/pago/error`,
  pending: `https://tu-dominio.com/profesionales/${slug}/pago/pendiente`,
},
auto_return: 'approved', // ✅ Permitido en producción
```

## Verificar Configuración

Puedes verificar tu configuración con:

```bash
curl http://localhost:3001/api/payments/config-check
```

## Debugging

Si aún tienes problemas, verifica los logs del servidor al crear la preferencia:

```bash
# Los logs mostrarán:
📤 Full preference payload to send: {...}
✅ MP preference created successfully
```

## Links Útiles

- [Documentación MercadoPago - Test](https://www.mercadopago.com.ar/developers/es/docs)
- [API Reference](https://www.mercadopago.com.ar/developers/es/reference)
- [Credenciales de prueba](https://www.mercadopago.com.ar/developers/panel/app)

## Notas Adicionales

1. **Siempre usa el `sandbox_init_point`** cuando estés en modo TEST
2. **Los webhooks en localhost** requieren ngrok u otra herramienta de tunneling
3. **Limpia cookies y caché** si cambias entre cuentas de prueba
4. **Verifica que el User ID del profesional sea correcto** en marketplace
