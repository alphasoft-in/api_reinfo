const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
    console.log('Migrating FREE users quota to 5...');
    try {
        const result = await sql`
            UPDATE usuarios 
            SET quota_limit = 5 
            WHERE plan = 'FREE' OR plan = 'BASIC' OR quota_limit = 10
        `;
        console.log('Migration successful. Users updated.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
