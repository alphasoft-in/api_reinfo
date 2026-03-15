const { neon } = require('@neondatabase/serverless');

async function enforcePolicy() {
    // Falls back to the development DB if URL not provided
    const url = "postgresql://neondb_owner:npg_R2mdcxrKi9fT@ep-rapid-river-andv4068-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    const sql = neon(url);
    try {
        console.log('--- Superadmin Enforcement Script ---');
        console.log('Target Superadmin:', 'rtipiani@gmail.com');

        // 1. Correct the email for the 'rtipiani' user if it needs updating
        const updateRtipiani = await sql`UPDATE usuarios SET email = 'rtipiani@gmail.com' WHERE username = 'rtipiani'`;
        console.log(`- Updated 'rtipiani' user email: ${updateRtipiani.length} row(s)`);
        
        // 2. Identify superadmin by the specific email
        const setSuperadmin = await sql`UPDATE usuarios SET role = 'superadmin', plan = 'PLATFORM', quota_limit = 999999999 WHERE LOWER(email) = 'rtipiani@gmail.com'`;
        console.log(`- Set superadmin role for 'rtipiani@gmail.com': ${setSuperadmin.length} row(s)`);
        
        // 3. Reset all other users to 'user' role and 'BASIC' plan
        const resetOthers = await sql`UPDATE usuarios SET role = 'user', plan = 'BASIC', quota_limit = 100 WHERE LOWER(email) != 'rtipiani@gmail.com' OR email IS NULL`;
        console.log(`- Demoted all other users to 'user' role: ${resetOthers.length} row(s)`);

        console.log('-------------------------------------');
        console.log('Policy successfully enforced.');
    } catch (err) {
        console.error('Policy enforcement failed:', err);
    }
}

enforcePolicy();
