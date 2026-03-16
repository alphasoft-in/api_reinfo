# REINFO Pro API Documentation v1

Bienvenido a la documentación técnica de la API de REINFO Pro. Esta guía detalla todos los endpoints disponibles para la integración con sistemas corporativos.

---

## 🔐 Autenticación

La API soporta dos métodos de autenticación:
1.  **JWT (Sesión)**: Utilizado por el portal web (Cookie `reinfo_session`).
2.  **API Key**: Utilizado para integraciones externas.
    *   Header: `x-api-key: TU_LLAVE_SECRETA`

### 1. Iniciar Sesión
`POST /api/v1/auth/login`

**Body:**
```json
{
  "email": "usuario@empresa.com",
  "password": "tu_contraseña"
}
```

**Respuesta:**
*   `200 OK`: Devuelve los datos del usuario y establece una cookie HttpOnly.
*   `mfaRequired`: Si está activo, devuelve `mfaRequired: true` y un `mfaToken`.

---

### 2. Registro de Empresa
`POST /api/v1/auth/register`

**Body:**
```json
{
  "email": "admin@empresa.com",
  "password": "contraseña_segura",
  "plan": "FREE | PROFESSIONAL | ENTERPRISE"
}
```

---

### 3. Verificar 2FA (MFA)
`POST /api/v1/auth/2fa/verify`

**Headers:** Requiere cookie de sesión.
**Body:** `{"code": "123456"}`

---

## 🔍 Consultas Principal

### Consulta de Registros REINFO
`GET /api/v1/registros`

**Headers:** `x-api-key` o sesión activa.

**Parámetros URL:**
*   `ruc` (opcional): Filtro por número de RUC exacto.
*   `name` (opcional): Búsqueda parcial por nombre de minero.
*   `codigoUnico` (opcional): Filtro por código único de concesión.
*   `status` (opcional): `vigente` | `suspendido`.
*   `limit` (opcional): Cantidad de resultados (default 25).
*   `offset` (opcional): Paginación.

**Respuesta:**
```json
{
  "success": true,
  "count": 25,
  "totalCount": 540000,
  "filteredCount": 100,
  "data": [...]
}
```

---

## 👤 Gestión de Usuario

### Obtener Perfil y Uso
`GET /api/v1/user/usage`

Devuelve el estado actual de la cuenta, plan activo, cuota utilizada (`quota_used`) y límite total (`quota_limit`).

### Solicitar Cambio de Plan
`POST /api/v1/user/upgrade`

**Body:** `{"plan": "PROFESSIONAL | ENTERPRISE"}`
Crea una solicitud que debe ser aprobada por un administrador.

### Regenerar API Key
`POST /api/v1/user/reset-key`

Invalida la llave anterior y genera una nueva llave secreta para integraciones.

---

## 🛠 Administración (Superadmin Only)

### Listado de Usuarios
`GET /api/v1/admin/users`

### Actualizar Usuario (Aprobación de Pagos)
`POST /api/v1/admin/users`

**Body:**
```json
{
  "userId": 1,
  "payment_status": "active | pending",
  "plan": "FREE | PROFESSIONAL | ENTERPRISE",
  "active": true/false
}
```

### Estadísticas Globales
`GET /api/v1/stats`

### Configuración de Planes
`GET /api/v1/planes` (Listar planes y sus límites configurados)

---

## ⚠️ Códigos de Error

| Código | Significado | Causa Común |
| :--- | :--- | :--- |
| **400** | Bad Request | Parámetros faltantes o mal formateados. |
| **401** | Unauthorized | API Key inválida o sesión expirada. |
| **403** | Forbidden | Cuenta suspendida, cuota agotada o suscripción vencida. |
| **429** | Too Many Requests | Límite de tasa alcanzado o cuenta bloqueada por intentos fallidos. |
| **500** | Server Error | Error inesperado en el sistema. |
