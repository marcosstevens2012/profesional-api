# Endpoint de Estado de Pago - MercadoPago Return

## 📍 Nuevo Endpoint

```
GET /payments/status
```

**🔓 Endpoint público** (no requiere autenticación)

---

## 🎯 Propósito

Este endpoint está diseñado específicamente para las **páginas de retorno de MercadoPago** (éxito, error, pendiente). Permite obtener el estado completo de un pago usando los parámetros que MercadoPago envía en la URL de redirección.

---

## 📥 Parámetros de Query (todos opcionales)

MercadoPago envía estos parámetros cuando redirige al usuario:

| Parámetro            | Descripción                                          | Ejemplo                     |
| -------------------- | ---------------------------------------------------- | --------------------------- |
| `payment_id`         | ID del pago en MercadoPago                           | `129194085837`              |
| `collection_id`      | ID de la colección (generalmente igual a payment_id) | `129194085837`              |
| `external_reference` | Tu booking ID interno                                | `cmgpcf29u0001zl01gapokal7` |
| `preference_id`      | ID de la preferencia de pago                         | `2642663435-78e7c1b1-...`   |
| `status`             | Estado del pago (informativo)                        | `approved`                  |
| `payment_type`       | Tipo de pago                                         | `credit_card`               |
| `merchant_order_id`  | ID de la orden                                       | `34712773553`               |

**Nota**: Solo necesitas **UNO** de estos parámetros para encontrar el pago, pero cuantos más envíes, más precisa será la búsqueda.

---

## 🔍 Lógica de Búsqueda

El endpoint busca el pago en la base de datos intentando:

1. **payment_id** → Busca en `Payment.paymentId` y `Payment.gatewayPaymentId`
2. **collection_id** → Busca en `Payment.paymentId` y `Payment.gatewayPaymentId`
3. **preference_id** → Busca en `Payment.preferenceId`
4. **external_reference** → Busca el booking asociado por `Booking.id`

Si encuentra coincidencia con cualquiera de estos criterios, devuelve el pago.

---

## 📤 Respuesta Exitosa (200)

```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "clx1a2b3c4d5e6f7g8h9i0j1k",
      "status": "COMPLETED",
      "amount": 25000,
      "currency": "ARS",
      "paymentId": "129194085837",
      "preferenceId": "2642663435-78e7c1b1-32de-4dc2-984f-3218eb8199a8",
      "paidAt": "2025-10-13T16:09:52.000Z",
      "createdAt": "2025-10-13T16:00:00.000Z"
    },
    "booking": {
      "id": "cmgpcf29u0001zl01gapokal7",
      "scheduledAt": "2025-10-15T10:00:00.000Z",
      "duration": 60,
      "status": "CONFIRMED",
      "jitsiRoom": "34k001ry-a1b2c3d4",
      "meetingStatus": "PENDING",
      "professional": {
        "id": "...",
        "name": "Dr. Juan Pérez",
        "email": "juan@example.com"
      },
      "client": {
        "id": "...",
        "name": "María González",
        "email": "maria@example.com"
      }
    }
  }
}
```

---

## ❌ Respuesta de Error (400)

```json
{
  "statusCode": 400,
  "message": "Payment not found with provided parameters: {...}",
  "error": "Bad Request"
}
```

---

## 🖥️ Ejemplo de Uso en el Frontend

### URL completa de retorno de MercadoPago:

```
http://localhost:3000/profesionales/cmgfrv34k001ryy32uf1fgtcm/pago/exito?
  collection_id=129194085837&
  collection_status=approved&
  payment_id=129194085837&
  status=approved&
  external_reference=cmgpcf29u0001zl01gapokal7&
  payment_type=credit_card&
  merchant_order_id=34712773553&
  preference_id=2642663435-78e7c1b1-32de-4dc2-984f-3218eb8199a8&
  site_id=MLA&
  processing_mode=aggregator&
  merchant_account_id=null
```

### Llamada al endpoint desde React/Next.js:

```typescript
// Extraer los query params de la URL
const searchParams = new URLSearchParams(window.location.search);

// Construir la URL del endpoint
const apiUrl = new URL('http://localhost:3001/payments/status');
apiUrl.searchParams.append('payment_id', searchParams.get('payment_id') || '');
apiUrl.searchParams.append('external_reference', searchParams.get('external_reference') || '');
apiUrl.searchParams.append('preference_id', searchParams.get('preference_id') || '');

// Hacer la petición
const response = await fetch(apiUrl.toString());
const data = await response.json();

if (data.success) {
  // Mostrar información del pago y booking
  console.log('Payment:', data.data.payment);
  console.log('Booking:', data.data.booking);
  console.log('Status:', data.data.payment.status);
} else {
  // Manejar error
  console.error('Payment not found');
}
```

### Con axios:

```typescript
import axios from 'axios';

const getPaymentStatus = async (queryParams: URLSearchParams) => {
  try {
    const response = await axios.get('http://localhost:3001/payments/status', {
      params: {
        payment_id: queryParams.get('payment_id'),
        collection_id: queryParams.get('collection_id'),
        external_reference: queryParams.get('external_reference'),
        preference_id: queryParams.get('preference_id'),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw error;
  }
};

// Uso en un componente
const PaymentSuccess = () => {
  const [paymentData, setPaymentData] = useState(null);
  const searchParams = new URLSearchParams(window.location.search);

  useEffect(() => {
    getPaymentStatus(searchParams)
      .then((data) => setPaymentData(data))
      .catch((error) => console.error(error));
  }, []);

  // Renderizar UI con paymentData
};
```

---

## 🆚 Diferencia con el endpoint anterior

### `/payments/payment/:id` (ya existía)

- Requiere conocer el **ID interno (CUID)** o el **Payment ID de MercadoPago**
- Busca por un único identificador
- Útil cuando ya tienes el ID específico

### `/payments/status` (nuevo) ✨

- Acepta **múltiples parámetros** de MercadoPago
- **Búsqueda inteligente** usando cualquier combinación
- **Optimizado para las páginas de retorno** de MercadoPago
- **Público** (no requiere autenticación)
- Devuelve información **estructurada** para UI de éxito/error

---

## 🎨 Estados de Pago

El campo `payment.status` puede tener estos valores:

- `PENDING` - Pendiente de pago
- `APPROVED` - Aprobado
- `COMPLETED` - Completado exitosamente
- `FAILED` - Fallido o rechazado
- `CANCELLED` - Cancelado
- `REFUNDED` - Reembolsado
- `REJECTED` - Rechazado

---

## 🔐 Seguridad

- El endpoint es **público** para permitir las redirecciones de MercadoPago
- No expone información sensible de tarjetas
- Solo devuelve información ya pública del pago y booking
- Los logs registran todos los accesos para auditoría

---

## 📊 Logs

El endpoint genera estos logs:

```
[INFO] 🔍 Getting payment status from MP return URL { payment_id: '...', ... }
[DEBUG] 🔍 Getting payment by MP return params { payment_id: '...', ... }
[INFO] ✅ Payment found by MP params: clx... (MP ID: 129194085837)
```

O en caso de error:

```
[WARN] Payment not found with MP params { payment_id: '...', ... }
[ERROR] ❌ Error getting payment status
```

---

## ✅ Testing

### Con curl:

```bash
curl "http://localhost:3001/payments/status?payment_id=129194085837&external_reference=cmgpcf29u0001zl01gapokal7"
```

### Con Swagger:

1. Ir a `http://localhost:3001/api`
2. Buscar `GET /payments/status`
3. Click en "Try it out"
4. Ingresar los parámetros
5. Click en "Execute"

---

## 📝 Notas Adicionales

1. **Cache del navegador**: El endpoint puede devolver `304 Not Modified` si el navegador tiene la respuesta en caché. Usa `Cache-Control: no-cache` en desarrollo si necesitas.

2. **Parámetros duplicados**: MercadoPago a veces envía `payment_id` y `collection_id` con el mismo valor. El endpoint maneja esto correctamente.

3. **External reference**: Es el `bookingId` que enviaste al crear la preferencia. Es la forma más directa de encontrar el pago.

4. **Timeout**: Si la búsqueda tarda mucho, considera agregar un índice en la tabla `Payment` para los campos `paymentId`, `gatewayPaymentId`, y `preferenceId`.

---

## 🚀 Próximos pasos sugeridos

1. **Frontend**: Crear componentes de UI para las páginas de éxito/error/pendiente
2. **Polling**: Implementar polling si el pago está pendiente
3. **Notificaciones**: Mostrar toast/notification basado en el estado
4. **Analytics**: Trackear conversiones según el estado del pago
5. **Cache**: Implementar caché de corta duración para reducir queries a DB

---

## 📚 Referencias

- [MercadoPago - Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
- [MercadoPago - Web Checkout](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/checkout-customization/user-interface/redirection)
