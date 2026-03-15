const { neon } = require('@neondatabase/serverless');

async function listUsers() {
    const url = "postgresql://neondb_owner:npg_R2mdcxrKi9fT@ep-rapid-river-andv4068-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    const sql = neon(url);
    try {
        const users = await sql`SELECT id, username, email, role FROM usuarios`;
        console.table(users);
    } catch (err) {
        console.error('Failed to list users:', err);
    }
}

listUsers();
