const { neon } = require('@neondatabase/serverless');

const getSql = () => {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL no está definida en las variables de entorno.");
    }
    // IMPORTANT: We use tagged template literals (sql`...`) to prevent SQL injection.
    // Neon's client automatically handles parameter escaping when used this way.
    return neon(process.env.DATABASE_URL);
};

const initDb = async () => {
    const sql = getSql();
    try {
        // Enable extensions
        await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;

        await sql`
            CREATE TABLE IF NOT EXISTS registros (
                numero SERIAL PRIMARY KEY,
                ruc TEXT,
                minero TEXT,
                codigo_unico TEXT,
                nombre_derecho TEXT,
                departamento TEXT,
                provincia TEXT,
                distrito TEXT,
                estado TEXT,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Indexes for registros
        await sql`CREATE INDEX IF NOT EXISTS idx_registros_ruc ON registros(ruc)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_registros_minero ON registros USING GIST (minero gist_trgm_ops)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_registros_estado ON registros(estado)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_registros_codigo_unico ON registros(codigo_unico)`;
        await sql`
            CREATE TABLE IF NOT EXISTS planes (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                price TEXT NOT NULL,
                "limit" TEXT NOT NULL,
                features TEXT[] DEFAULT '{}',
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Seed default planes if empty
        const planesCount = await sql`SELECT count(*) FROM planes`;
        if (parseInt(planesCount[0].count) === 0) {
            await sql`
                INSERT INTO planes (name, price, "limit", features) VALUES 
                ('Free', '0', '5', '{"5 Consultas Únicas", "Acceso portal", "Soporte email"}'),
                ('Professional', '49', '5000', '{"5k Consultas RUC", "Exportación Excel/CSV", "API Key dedicada", "Soporte prioritario"}'),
                ('Enterprise', '199', '20000', '{"20k Consultas RUC", "Conexión Directa DB", "Analítica avanzada", "SLA 99.9%", "Manager dedicado"}')
            `;
        }

        await sql`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT,
                role TEXT DEFAULT 'user',
                api_key TEXT UNIQUE,
                plan TEXT DEFAULT 'FREE',
                subscription_end TIMESTAMP WITH TIME ZONE,
                quota_limit INTEGER DEFAULT 5,
                quota_used INTEGER DEFAULT 0,
                active BOOLEAN DEFAULT TRUE,
                payment_status TEXT DEFAULT 'pending',
                requested_plan TEXT,
                last_payment_at TIMESTAMP WITH TIME ZONE,
                two_factor_secret TEXT,
                two_factor_enabled BOOLEAN DEFAULT FALSE,
                last_login TIMESTAMP WITH TIME ZONE,
                failed_attempts INTEGER DEFAULT 0,
                locked_until TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Migration: Ensure all columns exist for older database versions
        await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'`;
        await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS requested_plan TEXT`;
        await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP WITH TIME ZONE`;
        await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS two_factor_secret TEXT`;
        await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE`;
        await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0`;
        await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE`;
        await sql`
            CREATE TABLE IF NOT EXISTS consultas_log (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES usuarios(id),
                ruc TEXT,
                queried_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Indexes for consultas_log
        await sql`CREATE INDEX IF NOT EXISTS idx_consultas_log_ruc ON consultas_log(ruc)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_consultas_log_user_id ON consultas_log(user_id)`;

        console.log('Neon Database initialized successfully with indexes.');
    } catch (error) {
        console.error('Error initializing Neon DB:', error);
        throw error;
    }
};

const addRegistros = async (registros) => {
    const sql = getSql();
    for (const r of registros) {
        await sql`
            INSERT INTO registros (ruc, minero, codigo_unico, nombre_derecho, departamento, provincia, distrito, estado)
            VALUES (${r.ruc}, ${r.minero}, ${r.codigoUnico}, ${r.nombreDerecho}, ${r.departamento}, ${r.provincia}, ${r.distrito}, ${r.estado})
        `;
    }
};

const getRegistros = async (filter, limit = 25, offset = 0) => {
    const sql = getSql();
    const select = sql`
        SELECT 
            numero, ruc, minero, 
            codigo_unico as "codigoUnico", 
            nombre_derecho as "nombreDerecho", 
            departamento, provincia, distrito, estado 
        FROM registros 
    `;
    
    if (filter.ruc) {
        return await sql`${select} WHERE ruc = ${filter.ruc} LIMIT ${limit} OFFSET ${offset}`;
    }
    if (filter.minero) {
        const pattern = `%${filter.minero}%`;
        return await sql`${select} WHERE minero ILIKE ${pattern} LIMIT ${limit} OFFSET ${offset}`;
    }
    if (filter.codigoUnico) {
        return await sql`${select} WHERE codigo_unico = ${filter.codigoUnico} LIMIT ${limit} OFFSET ${offset}`;
    }
    if (filter.estado) {
        return await sql`${select} WHERE estado = ${filter.estado} LIMIT ${limit} OFFSET ${offset}`;
    }
    return await sql`${select} LIMIT ${limit} OFFSET ${offset}`;
};

const countRegistros = async (filter) => {
    const sql = getSql();
    if (filter.ruc) {
        const res = await sql`SELECT count(*) FROM registros WHERE ruc = ${filter.ruc}`;
        return parseInt(res[0].count);
    }
    const res = await sql`SELECT count(*) FROM registros`;
    return parseInt(res[0].count);
};

const getStats = async () => {
    const sql = getSql();
    const total = await sql`SELECT count(*) FROM registros`;
    const vigentes = await sql`SELECT count(*) FROM registros WHERE estado = 'VIGENTE'`;
    const suspendidos = await sql`SELECT count(*) FROM registros WHERE estado = 'SUSPENDIDO'`;
    return {
        total: parseInt(total[0].count),
        vigentes: parseInt(vigentes[0].count),
        suspendidos: parseInt(suspendidos[0].count)
    };
};

const getUserByUsername = async (username) => {
    const sql = getSql();
    const users = await sql`SELECT * FROM usuarios WHERE username = ${username}`;
    return users[0];
};

const getUserById = async (id) => {
    const sql = getSql();
    const users = await sql`SELECT * FROM usuarios WHERE id = ${id}`;
    return users[0];
};

const getUserByApiKey = async (apiKey) => {
    const sql = getSql();
    const users = await sql`SELECT * FROM usuarios WHERE api_key = ${apiKey}`;
    return users[0];
};

const getUserByEmail = async (email) => {
    const sql = getSql();
    const users = await sql`SELECT * FROM usuarios WHERE LOWER(email) = ${email.toLowerCase()}`;
    return users[0];
};

const createUser = async (userData) => {
    const sql = getSql();
    const { email, password, role = 'user', plan = 'FREE', quota_limit = 5, subscription_end = null } = userData;
    const username = userData.username || email;
    const apiKey = 'sk_reinfo_' + Math.random().toString(36).substring(2, 15);
    const res = await sql`
        INSERT INTO usuarios (username, password, email, role, api_key, plan, quota_limit, subscription_end, requested_plan)
        VALUES (${username}, ${password}, ${email}, ${role}, ${apiKey}, ${plan}, ${quota_limit}, ${subscription_end}, ${userData.requested_plan || null})
        RETURNING id, api_key
    `;
    return res[0];
};

const updateQuota = async (userId) => {
    const sql = getSql();
    await sql`UPDATE usuarios SET quota_used = quota_used + 1 WHERE id = ${userId}`;
};

const logConsulta = async (userId, ruc) => {
    const sql = getSql();
    await sql`INSERT INTO consultas_log (user_id, ruc) VALUES (${userId}, ${ruc})`;
};

const getTopQueriedRucs = async (limit = 5) => {
    const sql = getSql();
    return await sql`
        SELECT ruc, count(*) as count 
        FROM consultas_log 
        GROUP BY ruc 
        ORDER BY count DESC 
        LIMIT ${limit}
    `;
};

const getAllUsers = async () => {
    const sql = getSql();
    return await sql`
        SELECT id, username, email, role, plan, quota_limit, quota_used, subscription_end, active, payment_status, requested_plan, last_payment_at, two_factor_enabled, created_at as "createdAt"
        FROM usuarios 
        ORDER BY created_at DESC
    `;
};

const adminUpdateUser = async (userId, updates) => {
    const sql = getSql();
    const { plan, quota_limit, subscription_end, active, role, payment_status, requested_plan } = updates;
    await sql`
        UPDATE usuarios 
        SET plan = ${plan}, quota_limit = ${quota_limit}, subscription_end = ${subscription_end}, active = ${active}, role = ${role}, payment_status = ${payment_status}, requested_plan = ${requested_plan || null}
        WHERE id = ${userId}
    `;
};

const setUser2FASecret = async (userId, secret) => {
    const sql = getSql();
    await sql`UPDATE usuarios SET two_factor_secret = ${secret} WHERE id = ${userId}`;
};

const enableUser2FA = async (userId, enabled) => {
    const sql = getSql();
    await sql`UPDATE usuarios SET two_factor_enabled = ${enabled} WHERE id = ${userId}`;
};

const updateLoginStats = async (userId, failedAttempts, lockedUntil = null) => {
    const sql = getSql();
    if (failedAttempts === 0) {
        await sql`
            UPDATE usuarios 
            SET failed_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP 
            WHERE id = ${userId}
        `;
    } else {
        await sql`
            UPDATE usuarios 
            SET failed_attempts = ${failedAttempts}, locked_until = ${lockedUntil}
            WHERE id = ${userId}
        `;
    }
};

const deleteUser = async (userId) => {
    const sql = getSql();
    // Delete logs first to avoid FK constraint issues
    await sql`DELETE FROM consultas_log WHERE user_id = ${userId}`;
    await sql`DELETE FROM usuarios WHERE id = ${userId}`;
};

module.exports = {
    initDb,
    addRegistros,
    getRegistros,
    countRegistros,
    getStats,
    getUserByUsername,
    getUserById,
    getUserByEmail,
    getUserByApiKey,
    updateQuota,
    logConsulta,
    getTopQueriedRucs,
    createUser,
    getAllUsers,
    adminUpdateUser,
    deleteUser,
    updateLoginStats,
    setUser2FASecret,
    enableUser2FA,
    getPlanes: async () => {
        const sql = getSql();
        return await sql`SELECT * FROM planes ORDER BY id ASC`;
    },
    updatePlan: async (id, updates) => {
        const sql = getSql();
        const { price, limit, features } = updates;
        await sql`
            UPDATE planes 
            SET price = ${price}, "limit" = ${limit}, features = ${features} 
            WHERE id = ${id}
        `;
    }
};
