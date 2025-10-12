# 🚀 Quick Start - Ver Documentación Swagger

## 1️⃣ Iniciar el Servidor

```bash
npm run start:dev
```

Espera a ver este mensaje:

```
✅ Application is running on: http://localhost:3001
```

## 2️⃣ Abrir Swagger UI

Abre tu navegador en:

```
http://localhost:3001/api
```

## 3️⃣ Explorar la API

### Endpoints Disponibles

#### 💳 **Pagos**

- `POST /payments/mp/preference` - Crear preferencia de pago
- `POST /payments/webhook` - Webhook de MercadoPago (público)
- `GET /payments/config-check` - Verificar configuración (público)
- `POST /payments/test-cards` - Info de tarjetas de prueba
- `GET /payments/payment/{id}` - Obtener pago por ID

## 4️⃣ Probar un Endpoint

### Ejemplo: Crear Preferencia de Pago

1. **Expandir** el endpoint `POST /payments/mp/preference`
2. Click en **"Try it out"**
3. **Editar** el request body:

```json
{
  "title": "Consulta Psicológica",
  "amount": 25000,
  "professionalSlug": "dr-juan-perez",
  "payerEmail": "test@example.com",
  "payerName": "María",
  "payerSurname": "González"
}
```

4. Click en **"Execute"**
5. Ver la **respuesta** abajo

### Ejemplo: Verificar Configuración

1. Expandir `GET /payments/config-check`
2. Click en **"Try it out"**
3. Click en **"Execute"**
4. Ver información del entorno actual

## 5️⃣ Usar la Respuesta

Copia el `init_point` o `sandbox_init_point` de la respuesta:

```json
{
  "init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
}
```

Abre esa URL en tu navegador para probar el pago con tarjetas de prueba.

## 🎯 Tarjetas de Prueba

### ✅ Aprobadas

```
Mastercard: 5031 7557 3453 0604
CVV: 123
Fecha: 12/30
Nombre: APRO
```

```
Visa: 4509 9535 6623 3704
CVV: 123
Fecha: 12/30
Nombre: APRO
```

### ❌ Rechazadas

```
Visa: 4774 4612 9001 0078
CVV: 123
Fecha: 12/30
```

## 📱 Desde la Terminal

### Crear preferencia

```bash
curl -X POST http://localhost:3001/api/payments/mp/preference \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Consulta Test",
    "amount": 25000,
    "professionalSlug": "test-professional",
    "payerEmail": "test@example.com"
  }'
```

### Verificar configuración

```bash
curl http://localhost:3001/api/payments/config-check
```

## 📚 Documentación Completa

- **Swagger UI:** http://localhost:3001/api
- **JSON OpenAPI:** http://localhost:3001/api-json
- **Documentación Markdown:** Ver archivo `SWAGGER_DOCUMENTATION.md`

## 🔧 Troubleshooting

### Servidor no inicia

```bash
# Verificar que el puerto 3001 esté libre
lsof -i :3001

# O cambiar el puerto en .env
PORT=3002
```

### Swagger UI no carga

```bash
# Verificar que la app esté corriendo
curl http://localhost:3001/health

# Verificar logs del servidor
```

### Error de configuración MP

```bash
# Verificar variables de entorno
curl http://localhost:3001/api/payments/config-check

# Debe retornar has_access_token: true
```

## 🎨 Características de Swagger UI

- ✅ **Try it out:** Probar endpoints directamente
- ✅ **Schemas:** Ver estructura de datos
- ✅ **Examples:** Valores de ejemplo pre-cargados
- ✅ **Responses:** Ver posibles respuestas
- ✅ **Copy:** Copiar código de ejemplo
- ✅ **Download:** Descargar spec OpenAPI

## 💡 Tips

1. **Usa los ejemplos:** Click en "Example Value" para cargar datos
2. **Revisa los schemas:** Expandir para ver estructura completa
3. **Copia curl:** Swagger genera el comando curl automáticamente
4. **Authorization:** Los endpoints públicos no requieren token
5. **Sandbox mode:** Asegúrate de usar tarjetas de prueba

## 📖 Más Información

- `SWAGGER_DOCUMENTATION.md` - Documentación completa de endpoints
- `MERCADOPAGO_TEST_CARDS_FIX.md` - Guía de tarjetas de prueba
- `SWAGGER_UPDATE_SUMMARY.md` - Resumen de cambios

---

**¡Listo para explorar! 🚀**

Abre http://localhost:3001/api y empieza a probar la API.
