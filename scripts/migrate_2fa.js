const { neon } = require('@neondatabase/serverless');

const migrate = async () => {
    const url = "postgresql://neondb_owner:npg_R2mdcxrKi9fT@ep-rapid-river-andv4068-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    const sql = neon(url);

    try {
        console.log("Iniciando migración de 2FA...");

        await sql`
            ALTER TABLE usuarios 
            ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
            ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT[]
        `;

        console.log("Migración completada exitosamente.");
    } catch (error) {
        console.error("Error en la migración:", error);
    }
}

migrate();
