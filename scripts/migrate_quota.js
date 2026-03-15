const { neon } = require('@neondatabase/serverless');

async function migrate() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL is not defined in the environment');
        process.exit(1);
    }

    const sql = neon(dbUrl);
    try {
        console.log('Starting quota migration...');
        // Using tagged template literal
        await sql`UPDATE usuarios SET quota_limit = 10 WHERE plan = 'FREE' OR plan = 'BASIC'`;
        console.log('Migration completed successfully.');
        
        const counts = await sql`SELECT count(*) FROM usuarios WHERE quota_limit = 10 AND (plan = 'FREE' OR plan = 'BASIC')`;
        console.log(`Users with 10-limit: ${counts[0].count}`);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
