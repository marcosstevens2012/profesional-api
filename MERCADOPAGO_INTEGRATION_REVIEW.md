# 📊 Revisión de Integración con MercadoPago

## 🔍 Análisis Comparativo

He comparado nuestra integración actual con el ejemplo oficial de la API de MercadoPago.

### ✅ Implementado Correctamente

- ✓ Endpoint: `POST https://api.mercadopago.com/checkout/preferences`
- ✓ Headers: `Authorization: Bearer TOKEN` y `Content-Type: application/json`
- ✓ Campos básicos: `items`, `external_reference`, `back_urls`, `auto_return`
- ✓ Marketplace: `marketplace_fee` y `split_payments`
- ✓ Webhook signature verification
- ✓ Idempotency key para prevenir duplicados

### ⚠️ Campos Adicionales Disponibles (No Implementados)

#### 1. **Información del Pagador (`payer`)** - RECOMENDADO

```typescript
payer: {
  name: "Juan",
  surname: "Pérez",
  email: "juan@ejemplo.com",
  phone: {
    area_code: "11",
    number: 12345678
  },
  identification: {
    type: "DNI", // 'CPF' (Brasil), 'DNI' (Argentina), 'CUIT', etc.
    number: "12345678"
  },
  address: {
    zip_code: "1234",
    street_name: "Calle Falsa",
    street_number: 123
  }
}
```

**Beneficios:**

- Pre-completa datos en el checkout (mejor UX)
- Reduce fricción en el pago
- Menor tasa de abandono

#### 2. **Currency ID** - IMPORTANTE

```typescript
items: [
  {
    title: "Consulta Profesional",
    currency_id: "ARS", // 'BRL', 'MXN', 'USD', etc.
    unit_price: 5000,
    quantity: 1,
  },
];
```

**Nota:** Fundamental si planean expandirse internacionalmente.

#### 3. **Statement Descriptor** - PROFESIONALISMO

```typescript
statement_descriptor: "PROFESIONAL"; // Máx 11 caracteres
```

Aparece en el extracto bancario del cliente. Mejora reconocimiento de marca.

#### 4. **Metadata Personalizado** - ÚTIL PARA TRACKING

```typescript
metadata: {
  booking_id: "booking_123",
  professional_id: "prof_456",
  service_type: "consulta_online",
  appointment_date: "2025-10-15T10:00:00Z"
}
```

**Beneficios:**

- Tracking interno mejorado
- Análisis de negocio
- Debugging facilitado

#### 5. **Tracking de Conversiones** - MARKETING

```typescript
tracks: [
  {
    type: "google_ad",
    values: {
      conversion_id: 123456,
      conversion_label: "purchase",
      pixel_id: "AW-123456789",
    },
  },
];
```

Para tracking de Google Ads, Facebook Pixel, etc.

#### 6. **Imagen del Servicio**

```typescript
items: [
  {
    picture_url: "https://tuapp.com/images/consulta-profesional.jpg",
    // ... otros campos
  },
];
```

Mejora la presentación en el checkout.

## 🚀 Ejemplo de Uso Mejorado

### Antes (Implementación Actual)

```typescript
const mpPreferenceData = {
  items: [
    {
      title: "Consulta con Profesional",
      quantity: 1,
      unit_price: amount,
      category_id: "services",
      description: `Consulta profesional con ${professionalSlug}`,
    },
  ],
  external_reference: external_reference,
  back_urls: {
    success: `http://localhost:3001/profesionales/${professionalSlug}/pago/exito`,
    failure: `http://localhost:3001/profesionales/${professionalSlug}/pago/error`,
    pending: `http://localhost:3001/profesionales/${professionalSlug}/pago/pendiente`,
  },
  auto_return: "approved",
};
```

### Después (Implementación Mejorada) ⭐

```typescript
const mpPreferenceData = {
  items: [
    {
      id: `service_${professionalSlug}`, // ID único del servicio
      title: "Consulta Profesional Online",
      description: `Consulta profesional con ${professionalName}`,
      picture_url: professionalImageUrl, // Foto del profesional
      category_id: "services",
      quantity: 1,
      currency_id: "ARS", // o detectar por país
      unit_price: amount,
    },
  ],

  // 📧 Pre-completar datos del pagador (mejor UX)
  payer: {
    email: userEmail,
    name: userName,
    surname: userSurname,
    identification: {
      type: "DNI", // Adaptar según país
      number: userDNI,
    },
  },

  // 💳 Configuración de pagos
  payment_methods: {
    installments: 12,
    default_installments: 1,
    excluded_payment_types: [], // Permitir todos
    default_payment_method_id: "visa", // Tarjeta por defecto
  },

  // 🔗 URLs de retorno
  back_urls: {
    success: `${process.env.APP_URL}/profesionales/${professionalSlug}/pago/exito`,
    failure: `${process.env.APP_URL}/profesionales/${professionalSlug}/pago/error`,
    pending: `${process.env.APP_URL}/profesionales/${professionalSlug}/pago/pendiente`,
  },
  auto_return: "approved",

  // 🔔 Webhook
  notification_url: `${process.env.APP_URL}/api/payments/webhook`,

  // 📊 Metadata para tracking interno
  metadata: {
    booking_id: bookingId,
    professional_id: professionalId,
    service_type: "online_consultation",
    appointment_date: appointmentDate,
    platform: "web",
  },

  // 💰 Marketplace (si aplica)
  marketplace: "PROFESIONAL-MARKETPLACE",
  marketplace_fee: platformFee,

  // 🏦 Descriptor en extracto
  statement_descriptor: "PROFESIONAL",

  // 📍 Referencia externa
  external_reference: bookingId,

  // ⏰ Expiración (opcional)
  expires: true,
  expiration_date_from: new Date().toISOString(),
  expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas

  // 📈 Tracking de conversiones (opcional)
  tracks: [
    {
      type: "google_ad",
      values: {
        conversion_id: parseInt(process.env.GOOGLE_ADS_CONVERSION_ID || "0"),
        conversion_label: "purchase",
      },
    },
  ],
};
```

## 🎯 Recomendaciones Prioritarias

### 1. **ALTA PRIORIDAD** 🔴

#### ✅ Agregar Currency ID

```typescript
// En apps/api/src/payments/payments.controller.ts
items: [
  {
    currency_id: "ARS", // o detectar dinámicamente
    // ... resto de campos
  },
];
```

#### ✅ Agregar Payer Email (mínimo)

```typescript
payer: {
  email: userEmail || payerEmail;
}
```

#### ✅ Statement Descriptor

```typescript
statement_descriptor: "PROFESIONAL"; // Aparece en extracto bancario
```

### 2. **MEDIA PRIORIDAD** 🟡

#### ✅ Metadata para tracking

```typescript
metadata: {
  booking_id: bookingId,
  professional_id: professionalId,
  service_type: serviceType
}
```

#### ✅ Imagen del servicio

```typescript
items: [
  {
    picture_url: professional.profileImage || defaultImage,
  },
];
```

### 3. **BAJA PRIORIDAD** 🟢

- Differential pricing (descuentos especiales)
- Tracking de conversiones (si usan ads)
- Datos completos del payer (nombre, dirección, etc.)

## 📝 Response de MercadoPago

Cuando creas una preferencia, MercadoPago devuelve:

```typescript
{
  "id": "202809963-920c288b-4ebb-40be-966f-700250fa5370",
  "init_point": "https://www.mercadopago.com/mla/checkout/start?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.com/mla/checkout/pay?pref_id=...",
  "collector_id": 202809963,
  "client_id": "6295877106812064",
  "marketplace": "MP-MKT-6295877106812064",
  "date_created": "2022-11-17T10:37:52.000-05:00",
  "items": [...],
  "back_urls": {...},
  "metadata": {...},
  // ... más campos
}
```

**Campos importantes a guardar:**

- `id` → Guardar como `preferenceId` en BD
- `init_point` → URL para redirigir al usuario (producción)
- `sandbox_init_point` → URL para testing
- `collector_id` → ID del vendedor

## 🔐 Seguridad

### ✅ Ya implementado:

- Webhook signature verification
- Idempotency key para prevenir duplicados
- Token en variables de entorno

### 📋 Checklist adicional:

- [ ] Validar amounts en backend (nunca confiar en frontend)
- [ ] Verificar que el `external_reference` sea único
- [ ] Validar que el `collector_id` en respuesta corresponda al esperado
- [ ] Implementar rate limiting en endpoints de pago
- [ ] Logs de auditoría de todas las transacciones

## 🧪 Testing

### Tarjetas de prueba (ya las tienes implementadas):

```typescript
// APPROVED
{ number: "5031755734530604", cvv: "123" }

// REJECTED (insufficient funds)
{ number: "5031756205762679", cvv: "123" }

// PENDING
{ number: "5031753738768678", cvv: "123" }
```

### URLs de testing:

- Producción: `https://www.mercadopago.com/mla/checkout/start?pref_id=...`
- Sandbox: `https://sandbox.mercadopago.com/mla/checkout/pay?pref_id=...`

## 🌍 Monedas Soportadas

```typescript
const CURRENCIES = {
  AR: "ARS", // Argentina - Peso argentino
  BR: "BRL", // Brasil - Real brasileño
  CL: "CLP", // Chile - Peso chileno
  CO: "COP", // Colombia - Peso colombiano
  MX: "MXN", // México - Peso mexicano
  PE: "PEN", // Perú - Nuevo sol
  UY: "UYU", // Uruguay - Peso uruguayo
  VE: "VES", // Venezuela - Bolívar soberano
};
```

## 📚 Documentación Oficial

- API Reference: https://www.mercadopago.com/developers/es/reference/preferences/_checkout_preferences/post
- Checkout Pro: https://www.mercadopago.com/developers/es/docs/checkout-pro/landing
- Webhooks: https://www.mercadopago.com/developers/es/docs/checkout-pro/additional-content/your-integrations/notifications/webhooks

## 🎯 Próximos Pasos Sugeridos

1. **Agregar `currency_id` a items** (detectar por país del profesional)
2. **Agregar `payer.email`** (pre-completar checkout)
3. **Agregar `statement_descriptor`** (mejor branding)
4. **Implementar `metadata`** (tracking interno mejorado)
5. **Considerar `picture_url`** (mejor UX)
6. **Testing exhaustivo** con todas las tarjetas de prueba
7. **Validación de amounts** en backend antes de crear preferencia

---

**Conclusión:** Tu integración actual es funcional y correcta para los casos básicos. Las mejoras sugeridas son para optimizar UX, tracking y preparar para escalabilidad internacional. 🚀
