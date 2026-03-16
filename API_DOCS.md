# Documentación de la API de Reinfo

La API de Reinfo permite a los desarrolladores y sistemas de terceros interactuar con la plataforma de registros mineros. Esta documentación describe los endpoints disponibles, los métodos de autenticación soportados y los formatos de solicitud y respuesta.

## URL Base

La URL base para todas las llamadas a la API es:
`https://api-reinfo.vercel.app/api/v1`

---

## Métodos de Autenticación

La API soporta tres mecanismos de autenticación dependiendo del endpoint y del caso de uso.

1.  **API Key (`x-api-key`)**: Ideal para integraciones servidor a servidor (S2S). Debes enviar la API Key en las cabeceras de la petición SÓLO para realizar búsquedas (endpoints protegidos como `/registros`).
    ```http
    x-api-key: sk_reinfo_tu_api_key_aqui
    ```
2.  **Bearer Token (`Authorization`)**: Ideal para aplicaciones web/móviles donde el usuario inicia sesión y obtiene un JSON Web Token (JWT).
    ```http
    Authorization: Bearer <tu_jwt_token>
    ```
3.  **Cookie de Sesión (`reinfo_session`)**: Utilizado internamente por el frontend de la plataforma cuando el usuario inicia sesión desde un navegador.

**Nota:** Los endpoints de autenticación pública (`/auth/login`, `/auth/register`) no requieren estar autenticado.

---

## Endpoints de Consultas de Registros (Core)

### 1. Consultar Registros Mineros
Busca y filtra dentro de la base de datos de Reinfo.
*   **Endpoint:** `/registros`
*   **Método:** `GET`
*   **Autenticación Requerida:** Sí (API Key, Bearer Token o Cookie)
*   **Limitaciones de Usuario Normal:** Los usuarios que no sean super administradores **deben** incluir al menos un parámetro de búsqueda (`ruc`, `name`, o `codigoUnico`). De lo contrario, recibirán una lista vacía. Además, los usuarios suspendidos (`active: false`) recibirán un error 403.

**Parámetros Query (URLSearchParams):**
*   `ruc` (String): Busca el registro por número exacto de RUC.
*   `name` (String): Busca coincidencias parciales en el nombre del minero (`minero`).
*   `codigoUnico` (String): Busca por código único exacto.
*   `status` (String): Filtra por estado. Opciones válidas: `vigente` o `suspendido`.
*   `limit` (Integer): Cantidad máxima de resultados a retornar. Por defecto es `25`. Máximo permitido: `100`.
*   `offset` (Integer): Desplazamiento para paginación. Por defecto es `0`.

**Ejemplo de Petición:**
```bash
curl -X GET "https://api-reinfo.vercel.app/api/v1/registros?ruc=20100100101" \
     -H "x-api-key: sk_reinfo_1234567890abcdef"
```

**Respuesta Exitosa (200 OK):**
```json
{
    "success": true,
    "count": 1,
    "totalCount": 150000,
    "filteredCount": 1,
    "data": [
        {
            "numero": 1024,
            "ruc": "20100100101",
            "minero": "MINERA LOS ANDES S.A.C.",
            "codigoUnico": "123456789",
            "nombreDerecho": "CONCESION MINERA ESPERANZA",
            "departamento": "AREQUIPA",
            "provincia": "AREQUIPA",
            "distrito": "YURA",
            "estado": "VIGENTE"
        }
    ]
}
```

**Posibles Errores:**
*   `401 Unauthorized`: API Key no proporcionada o inválida.
*   `403 Forbidden`: Cuota de consultas excedida, suscripción expirada o cuenta suspendida.

---

## Endpoints de Autenticación (`/auth`)

### 2. Iniciar Sesión
Inicia una sesión de usuario para obtener las cookies de autenticación o el token necesario para consultar datos del dashboard.
*   **Endpoint:** `/auth/login`
*   **Método:** `POST`
*   **Body (JSON):**
    ```json
    {
        "email": "usuario@ejemplo.com",
        "password": "mi_contraseña_secreta"
    }
    ```
*   **Respuesta Exitosa (200 OK):** Retorna los datos del usuario. Adicionalmente, configura automáticamente la cookie HttpOnly `reinfo_session`.
    ```json
    {
        "success": true,
        "user": {
            "username": "usuario@ejemplo.com",
            "email": "usuario@ejemplo.com",
            "role": "user",
            "apiKey": "sk_reinfo_xxxxxx",
            "quota": {
                "limit": 100,
                "used": 15
            },
            "two_factor_enabled": false,
            "active": true
        }
    }
    ```
    *Nota: Si el 2FA está activado, la respuesta devolverá `mfaRequired: true` con un `mfaToken` temporal para validar el OTP.*

### 3. Verificar MFA (2FA Login)
Validar el código OTP generado por la aplicación de autenticación (Google Authenticator, Authy, etc.) si el usuario tiene el 2FA activo.
*   **Endpoint:** `/auth/login/verify`
*   **Método:** `POST`
*   **Body (JSON):**
    ```json
    {
        "code": "123456",
        "mfaToken": "jwt_token_temporal_entregado_en_login"
    }
    ```

### 4. Registro de Usuario
Crea una nueva cuenta en la plataforma. Por defecto, las cuentas nuevas tienen el plan `FREE` (límite de 100 consultas).
*   **Endpoint:** `/auth/register`
*   **Método:** `POST`
*   **Body (JSON):**
    ```json
    {
        "email": "nuevo@ejemplo.com",
        "password": "mi_contraseña_secreta"
    }
    ```

### 5. Obtener Perfil Actual (`/me`)
Retorna los datos del usuario actualmente autenticado (utilizado para hidratar la sesión del Frontend).
*   **Endpoint:** `/auth/me`
*   **Método:** `GET`
*   **Autenticación Requerida:** Sí (Bearer Token o Cookie)

### 6. Cerrar Sesión
Destruye la sesión actual eliminando la cookie de sesión del navegador.
*   **Endpoint:** `/auth/logout`
*   **Método:** `POST`

### 7. Configurar y Verificar 2FA (Seguridad de Cuenta)
*   **Generar Secreto (Setup):** `POST /auth/2fa/setup` (Autenticado). Retorna el URI para el código QR y el código secreto base32.
*   **Activar/Verificar:** `POST /auth/2fa/verify` (Autenticado). Activa o desactiva el 2FA pasando el código actual del autenticador y un flag `enable` (true/false).

---

## Endpoints de Usuario (`/user`)

### 8. Regenerar API Key
Invalida la API Key actual del usuario y genera una nueva de forma criptográficamente segura.
*   **Endpoint:** `/user/reset-key`
*   **Método:** `POST`
*   **Autenticación Requerida:** Sí (Bearer Token o Cookie)
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
        "success": true,
        "message": "API Key regenerada correctamente",
        "apiKey": "sk_reinfo_nueva_api_key_generada"
    }
    ```

### 9. Obtener Estadísticas de Uso (Dashboard)
Retorna el consumo de cuota actual y, para los administradores, las consultas (RUCs) más frecuentes.
*   **Endpoint:** `/user/usage`
*   **Método:** `GET`
*   **Autenticación Requerida:** Sí (Bearer Token o Cookie)

### 10. Actualizar Plan (Upgrade)
*Disclaimer: Actualmente este endpoint sirve como mock para subir de plan sin pasarela de pago real, útil para testing.*
*   **Endpoint:** `/user/upgrade`
*   **Método:** `POST`
*   **Autenticación Requerida:** Sí (Bearer Token o Cookie)
*   **Body (JSON):**
    ```json
    {
        "plan": "PROFESSIONAL" // o "ENTERPRISE"
    }
    ```

---

## Endpoints Generales y de Administración

### 11. Estadísticas Globales
Obtiene el recuento total de registros en la plataforma (Totales, Vigentes, Suspendidos).
*   **Endpoint:** `/stats`
*   **Método:** `GET`
*   **Autenticación Requerida:** Sí (Para acceder a estadísticas globales).

### 12. Gestión de Usuarios (Admin)
Mantenimiento de usuarios de la plataforma. (Solo disponible para usuarios con `role: superadmin`).
*   **Endpoint:** `/admin/users`
*   **Método:** `GET` (Lista todos los usuarios) / `POST` (Actualiza cuotas, planes o estados `active` de un usuario).
*   **Body (POST):**
    ```json
    {
        "userId": 5,
        "plan": "PROFESSIONAL",
        "quota_limit": 10000,
        "active": true,
        "role": "user",
        "payment_status": "paid",
        "subscription_end": "2024-12-31T23:59:59Z"
    }
    ```
