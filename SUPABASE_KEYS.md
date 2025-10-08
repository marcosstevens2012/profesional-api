# 🔑 Cómo Obtener las Claves de Supabase

## Claves que Faltan

Tu aplicación necesita estas claves de Supabase API (NO son las claves S3 que ya proporcionaste):

1. **SUPABASE_ANON_KEY** - Clave pública para el cliente
2. **SUPABASE_SERVICE_ROLE_KEY** - Clave privada para operaciones del servidor

## 📍 Dónde Encontrarlas

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/anqdbinmztorvdsausrn

2. En el menú lateral, ve a **Settings** (⚙️)

3. Haz clic en **API**

4. En la sección **Project API keys** encontrarás:
   ```
   anon public (anon key)    → SUPABASE_ANON_KEY
   service_role (secret)     → SUPABASE_SERVICE_ROLE_KEY
   ```

5. Copia cada una y actualiza tu `.env`:
   ```bash
   SUPABASE_ANON_KEY="eyJhbGc..."  # La clave pública (empieza con eyJ)
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."  # La clave secreta (también empieza con eyJ)
   ```

## ⚠️ Nota Importante

Las credenciales S3 que proporcionaste ya están configuradas como alternativa:
```
STORAGE_ACCESS_KEY="2f2a17b12672cc1d9f1b8338e0ab0f43"
STORAGE_SECRET_KEY="ecb3864f1e028b3c81834678c9028fdea36ba4bb989dfe83a1e09df2c1bc896a"
```

Pero la aplicación actual usa el cliente de Supabase JavaScript que requiere las **API keys** (anon y service_role), no las credenciales S3.

## 🔒 Seguridad

- ✅ `SUPABASE_ANON_KEY` - Puede exponerse al frontend (pública)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - NUNCA exponerla al frontend (privada)
- ❌ `STORAGE_SECRET_KEY` - NUNCA exponerla (privada)
