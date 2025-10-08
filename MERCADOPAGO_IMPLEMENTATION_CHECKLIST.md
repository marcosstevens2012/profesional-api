# ✅ Checklist de Implementación - MercadoPago Mejorado

## 📋 Estado Actual

### ✅ Completado

- [x] Revisión de integración actual vs API oficial
- [x] Interfaces TypeScript actualizadas
- [x] Método helper `createImprovedPreference()` implementado
- [x] DTO con validaciones creado
- [x] Ejemplos de uso documentados
- [x] Documentación completa generada

### 🔄 Próximos Pasos

## 1️⃣ Validación y Testing (INMEDIATO)

### Testing Básico

- [ ] Probar método `createImprovedPreference()` con datos mínimos
- [ ] Verificar respuesta de MercadoPago (init_point, preference_id)
- [ ] Validar que se genere correctamente el checkout

### Testing con Tarjetas de Prueba

- [ ] Tarjeta APPROVED: `5031755734530604`
- [ ] Tarjeta REJECTED: `5031756205762679`
- [ ] Tarjeta PENDING: `5031753738768678`

### Testing de Campos Nuevos

- [ ] Verificar que `currency_id` se envía correctamente
- [ ] Confirmar que `payer.email` pre-completa el checkout
- [ ] Validar que `statement_descriptor` aparece en extracto (usar cuenta real)
- [ ] Revisar que `metadata` se almacena en el payment de MP

### Testing de Webhooks

- [ ] Webhook de payment creado
- [ ] Webhook de payment approved
- [ ] Webhook de merchant_order
- [ ] Verificación de signature funciona

## 2️⃣ Migración del Controller (ESTA SEMANA)

### Actualizar Endpoint Existente

- [ ] Migrar `POST /payments/create-preference` a usar nuevo método
- [ ] Agregar `currency_id` (detectar por país del profesional)
- [ ] Agregar `payer.email` del usuario
- [ ] Agregar `statement_descriptor: "PROFESIONAL"`
- [ ] Agregar `metadata` con booking_id, professional_id, etc.

### Código de Ejemplo:

```typescript
// En apps/api/src/payments/payments.controller.ts

@Post('create-preference')
async createPreference(
  @Body() body: any,
  @Request() req: any
) {
  const { professionalSlug, amount, bookingId } = body;

  // Obtener profesional
  const professional = await this.professionalsService.findBySlug(professionalSlug);

  // Usar método mejorado
  const preference = await this._mercadoPagoService.createImprovedPreference({
    serviceId: `service_${bookingId}`,
    title: `Consulta con ${professional.name}`,
    amount: amount,
    currencyId: professional.country === 'AR' ? 'ARS' : 'BRL', // Ejemplo

    // Datos del usuario
    payerEmail: req.user?.email,
    payerName: req.user?.name,
    payerSurname: req.user?.surname,

    // URLs
    backUrls: {
      success: `${process.env.APP_URL}/profesionales/${professionalSlug}/pago/exito`,
      failure: `${process.env.APP_URL}/profesionales/${professionalSlug}/pago/error`,
      pending: `${process.env.APP_URL}/profesionales/${professionalSlug}/pago/pendiente`,
    },
    notificationUrl: `${process.env.APP_URL}/api/payments/webhook`,

    // Tracking
    externalReference: bookingId,
    metadata: {
      booking_id: bookingId,
      professional_id: professional.id,
      user_id: req.user?.id,
    },

    // Branding
    statementDescriptor: 'PROFESIONAL',
  });

  return { preference };
}
```

## 3️⃣ Mejoras de Seguridad (ESTA SEMANA)

### Validaciones Backend

- [ ] Validar que `amount > 0` en backend
- [ ] Verificar que `externalReference` sea único
- [ ] Validar que el usuario tiene permisos para el booking
- [ ] Verificar que el profesional existe y está activo

### Rate Limiting

- [ ] Implementar rate limit en `/payments/create-preference` (max 10/min por usuario)
- [ ] Implementar rate limit en `/payments/webhook` (max 100/min)

### Logs y Auditoría

- [ ] Log de todas las preferencias creadas
- [ ] Log de todos los payments procesados
- [ ] Log de todos los webhooks recibidos
- [ ] Alertas de errores críticos (Slack/Email)

## 4️⃣ Internacionalización (PRÓXIMA SEMANA)

### Detección Automática de Moneda

- [ ] Crear helper para detectar currency por país
- [ ] Mapear países a monedas (AR→ARS, BR→BRL, etc.)
- [ ] Aplicar en todos los endpoints de pago

### Ejemplo:

```typescript
// apps/api/src/payments/utils/currency.helper.ts

export const CURRENCY_MAP = {
  AR: "ARS",
  BR: "BRL",
  CL: "CLP",
  CO: "COP",
  MX: "MXN",
  PE: "PEN",
  UY: "UYU",
  VE: "VES",
};

export function getCurrencyByCountry(countryCode: string): string {
  return CURRENCY_MAP[countryCode] || "ARS";
}
```

### Testing Internacional

- [ ] Probar pago con ARS (Argentina)
- [ ] Probar pago con BRL (Brasil)
- [ ] Probar pago con otras monedas

## 5️⃣ Mejoras de UX (PRÓXIMA SEMANA)

### Pre-completar Datos del Usuario

- [ ] Obtener email del usuario autenticado
- [ ] Obtener nombre y apellido
- [ ] Obtener teléfono (si existe)
- [ ] Obtener DNI/identificación (si existe)

### Imágenes de Servicios

- [ ] Agregar `picture_url` con foto del profesional
- [ ] Fallback a imagen por defecto si no tiene foto
- [ ] Optimizar imágenes para MP (tamaño recomendado)

### Expiración de Preferencias

- [ ] Agregar expiración de 24 horas a preferencias
- [ ] Notificar al usuario si la preferencia expiró
- [ ] Permitir regenerar preferencia expirada

## 6️⃣ Marketplace Split (SI APLICA)

### Implementación de Split de Pagos

- [ ] Verificar que profesionales tengan MP User ID
- [ ] Configurar porcentaje de comisión de plataforma
- [ ] Implementar split en `createImprovedPreference()`
- [ ] Testing de splits en sandbox

### Código de Ejemplo:

```typescript
const platformFeePercentage = 10; // 10%
const platformFee = amount * (platformFeePercentage / 100);
const professionalAmount = amount - platformFee;

const preference = await this._mercadoPagoService.createImprovedPreference({
  // ... otros campos
  marketplace: "PROFESIONAL-MARKETPLACE",
  marketplaceFee: platformFee,
  splitPayments: [
    {
      amount: professionalAmount,
      fee_amount: 0,
      collector: {
        id: professional.mercadoPagoUserId,
      },
    },
  ],
});
```

## 7️⃣ Tracking y Analytics (FUTURO)

### Metadata Rica

- [ ] Guardar tipo de servicio en metadata
- [ ] Guardar fecha de cita en metadata
- [ ] Guardar origen (web/mobile) en metadata
- [ ] Guardar campaña de marketing (si aplica)

### Conversiones

- [ ] Integrar Google Ads tracking (si aplica)
- [ ] Integrar Facebook Pixel (si aplica)
- [ ] Dashboard de métricas de pago

## 8️⃣ Deploy y Monitoreo (ANTES DE PRODUCCIÓN)

### Staging

- [ ] Deploy a staging
- [ ] Testing E2E completo
- [ ] Testing de webhooks en staging
- [ ] Verificar logs y errores

### Producción

- [ ] Backup de BD antes de deploy
- [ ] Deploy gradual (feature flag)
- [ ] Monitoreo en tiempo real
- [ ] Rollback plan listo

### Post-Deploy

- [ ] Verificar primeros 10 pagos manualmente
- [ ] Revisar logs de errores
- [ ] Confirmar webhooks funcionando
- [ ] Validar splits (si aplica)

## 9️⃣ Documentación (CONTINUO)

### Docs Internas

- [x] MERCADOPAGO_INTEGRATION_REVIEW.md
- [x] MERCADOPAGO_CHANGES_SUMMARY.md
- [x] Ejemplos de uso
- [ ] Diagrama de flujo de pago
- [ ] Troubleshooting guide

### Docs para Equipo

- [ ] Guía de testing para QA
- [ ] Guía de configuración para DevOps
- [ ] Runbook para soporte

## 🔟 Optimizaciones Futuras (BACKLOG)

### Performance

- [ ] Cache de preferencias (si se regeneran)
- [ ] Retry automático en fallo de creación
- [ ] Queue para webhooks (si volumen alto)

### Features Adicionales

- [ ] Descuentos y cupones
- [ ] Pagos recurrentes/suscripciones
- [ ] Pagos en cuotas con promociones
- [ ] Multi-moneda en mismo checkout

---

## 📊 KPIs de Éxito

### Métricas a Monitorear

- [ ] Tasa de conversión de checkout (% pagos completados)
- [ ] Tiempo promedio de pago
- [ ] Tasa de error en creación de preferencias
- [ ] Tasa de webhooks procesados exitosamente
- [ ] Split de pagos correctos (marketplace)

### Objetivos

- Tasa de conversión > 70%
- Tiempo de pago < 2 minutos
- Tasa de error < 1%
- Webhooks procesados > 99%

---

## 🚨 Problemas Conocidos y Soluciones

### Problema 1: Preferencia no se crea

**Síntomas:** Error 400 de MP
**Solución:** Validar que `amount > 0` y todos los campos requeridos existen

### Problema 2: Webhook no llega

**Síntomas:** Payment aprobado pero no se procesa
**Solución:** Verificar `notification_url` accesible públicamente (no localhost)

### Problema 3: Split no funciona

**Síntomas:** Error al crear preferencia con split
**Solución:** Verificar que `collector.id` sea válido y que el profesional esté vinculado a MP

---

## 📞 Soporte

### Dudas Técnicas

- Documentación: `apps/api/MERCADOPAGO_INTEGRATION_REVIEW.md`
- Ejemplos: `apps/api/src/payments/examples/mercadopago-improved.examples.ts`
- MercadoPago Docs: https://www.mercadopago.com/developers

### Contacto MercadoPago

- Soporte: https://www.mercadopago.com/developers/es/support
- Slack de Partners (si aplica)

---

**Última actualización:** 7 de octubre de 2025
**Próxima revisión:** Después de implementación en staging
