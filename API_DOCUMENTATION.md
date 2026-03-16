# REINFO Pro API Documentation v1

Bienvenido a la documentación técnica de la API de REINFO Pro. Esta guía detalla todos los endpoints disponibles para la integración con sistemas corporativos, incluyendo estructuras de respuesta y ejemplos detallados.

---

## 🔐 Autenticación

La API soporta dos métodos de autenticación:
1.  **JWT (Sesión)**: Utilizado por el portal web (Cookie `reinfo_session`).
2.  **API Key**: Utilizado para integraciones externas.
    *   Header: `x-api-key: TU_LLAVE_SECRETA`

---

## 🔍 Consultas de Registros

### Consulta de Registros REINFO
`GET /api/v1/registros`

**Parámetros URL:**
*   `ruc`: Filtro por RUC exacto (11 dígitos).
*   `name`: Búsqueda parcial por nombre del minero.
*   `codigoUnico`: Filtro por código de concesión.
*   `status`: `vigente` | `suspendido`.
*   `limit`: Resultados por página (default 25).
*   `offset`: Paginación (default 0).

**Estructura de Respuesta (Success):**
```json
{
  "success": true,
  "count": 1,
  "totalCount": 540230,
  "filteredCount": 1,
  "data": [
    {
      "numero": 1234,
      "ruc": "20100100101",
      "minero": "MINERA DEL SUR S.A.C.",
      "codigoUnico": "010000115",
      "nombreDerecho": "SAN PEDRO 1",
      "departamento": "AREQUIPA",
      "provincia": "CARAVELI",
      "distrito": "CHALA",
      "estado": "VIGENTE"
    }
  ]
}
```

**Descripción de Campos:**
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `numero` | Integer | ID correlativo del registro. |
| `ruc` | String | Registro Único de Contribuyente. |
| `minero` | String | Nombre o Razón Social del operador. |
| `codigoUnico` | String | Código de la concesión minera. |
| `estado` | String | Estado actual (`VIGENTE`, `SUSPENDIDO`). |

---

## 👤 Perfil y Uso

### Obtener Uso de Cuota
`GET /api/v1/user/usage`

**Respuesta Exitosa:**
```json
{
  "success": true,
  "user": {
    "username": "admin@empresa.com",
    "plan": "PROFESSIONAL",
    "quota_limit": 5000,
    "quota_used": 1240,
    "subscription_end": "2026-04-15T10:00:00Z",
    "active": true,
    "two_factor_enabled": true
  }
}
```

---

## ⚠️ Manejo de Errores

Todas las respuestas de error siguen este formato:
```json
{
  "success": false,
  "message": "Descripción legible del error"
}
```

### Códigos de Estado Comunes
*   **401 Unauthorized**: API Key inválida o inexistente.
*   **403 Forbidden**: Cuota agotada o suscripción vencida.
*   **429 Too Many Requests**: Límite de tasa excedido.
*   **500 Internal Server Error**: Error inesperado en el servidor.

---

## 🛠 Ejemplo de Implementación (Node.js)

```javascript
const axios = require('axios');

async function checkRUC(ruc) {
  try {
    const res = await axios.get('https://api-reinfo.com/api/v1/registros', {
      params: { ruc },
      headers: { 'x-api-key': 'tu_llave_secreta' }
    });
    console.log('Estado:', res.data.data[0].estado);
  } catch (err) {
    console.error('Error:', err.response.data.message);
  }
}
```
